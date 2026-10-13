<?php

namespace App\Actions\ArtistOnboarding;

use App\Actions\Accounts\GrantRole;
use App\Actions\Accounts\IssuePasswordResetToken;
use App\Actions\Audit\RecordAuditEntry;
use App\Enums\ApplicationStatus;
use App\Enums\ArtistStatus;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Enums\Role;
use App\Events\ArtistApplicationApproved;
use App\Models\Artist;
use App\Models\ArtistApplication;
use App\Models\ArtistRating;
use App\Models\ArtistVideo;
use App\Models\SlugHistory;
use App\Models\User;
use App\Services\ArtistOnboarding\GenerateArtistSlug;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * An administrator approves a Submitted application (review-artist-application, L2-048.1): both
 * references must be verified; the applicant's account (made for the address when there is none, M3
 * D3) gains the Artist role; an Approved artist is created from the application with the next ACT
 * number and a free address, hidden until payout setup (`payout_ready` false, `published_at` null,
 * L2-048.3); the videos move to the artist; the approval is audited and the next-step email follows.
 */
class ApproveArtistApplication
{
    public function __construct(
        private readonly RecordAuditEntry $audit,
        private readonly GrantRole $grantRole,
        private readonly GenerateArtistSlug $slugs,
        private readonly IssuePasswordResetToken $resetTokens,
    ) {}

    /**
     * @throws ApplicationAlreadyDecided when the application is no longer Submitted
     * @throws ValidationException on `references` until both are verified
     */
    public function handle(ArtistApplication $application, User $administrator): ArtistApplication
    {
        [$application, $token] = DB::transaction(function () use ($application, $administrator): array {
            $application = ArtistApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            if ($application->status !== ApplicationStatus::Submitted) {
                throw new ApplicationAlreadyDecided;
            }
            if ($application->references()->whereNull('verified_at')->exists() || $application->references()->count() === 0) {
                throw ValidationException::withMessages(['references' => 'Verify both references before you approve.']);
            }

            [$user, $token] = $this->applicantAccount($application);
            $this->grantRole->handle($user, Role::Artist, $administrator);

            $artist = Artist::create([
                'user_id' => $user->id,
                'slug' => $this->slugs->handle($application->name),
                'ticket_number' => $this->nextTicketNumber(),
                'display_name' => $application->name,
                'act_type' => $application->act_type,
                'base_city' => $application->base_city,
                'base_latitude' => $application->base_latitude,
                'base_longitude' => $application->base_longitude,
                'max_drive_km' => $application->max_drive_km,
                'from_price_cents' => $application->from_price_cents,
                'bio' => $application->bio,
                'status' => ArtistStatus::Approved,
                'payout_ready' => false,
                'published_at' => null,
                'approved_at' => now()->utc(),
            ]);
            SlugHistory::create(['artist_id' => $artist->id, 'slug' => $artist->slug, 'retired_at' => null]);
            DB::table('artist_styles')->insert(array_map(
                fn (string $style) => ['artist_id' => $artist->id, 'style' => $style],
                array_values($application->styles ?? []),
            ));
            ArtistRating::create(['artist_id' => $artist->id, 'rating' => null, 'review_count' => 0]);
            ArtistVideo::where('artist_application_id', $application->id)->update(['artist_id' => $artist->id, 'updated_at' => now()]);

            $application->forceFill([
                'status' => ApplicationStatus::Approved,
                'decided_at' => now()->utc(),
                'decided_by' => $administrator->id,
                'artist_id' => $artist->id,
                'user_id' => $user->id,
            ])->save();

            $this->audit->handle($administrator, AuditAction::ApplicationApproved, $application, AuditOutcome::Succeeded, [
                'application_number' => $application->number,
                'artist_id' => $artist->id,
                'slug' => $artist->slug,
                'new_account' => $token !== null,
            ]);

            return [$application, $token];
        });

        ArtistApplicationApproved::dispatch($application->id, $token);

        return $application->fresh(['videos', 'references.verifier', 'decider', 'artist']);
    }

    /**
     * The applicant's account: the one that signed in to apply, the one with their address, or a new
     * one with a random password and a set-password link in the email (M3 D3).
     *
     * @return array{0: User, 1: string|null}
     */
    private function applicantAccount(ArtistApplication $application): array
    {
        $user = $application->user ?? User::whereRaw('lower(email) = ?', [Str::lower($application->email)])->first();
        if ($user !== null) {
            return [$user, null];
        }
        $user = User::create([
            'name' => $application->name,
            'email' => Str::lower($application->email),
            'password' => Str::random(40),
        ]);
        // The address received the confirmation and now this decision: it is theirs.
        $user->forceFill(['email_verified_at' => now()])->save();

        return [$user, $this->resetTokens->handle($user)];
    }

    /** "ACT-0027": one past the highest number so far, read under the transaction's lock. */
    private function nextTicketNumber(): string
    {
        DB::statement("select pg_advisory_xact_lock(hashtext('artists.ticket_number'))");
        $highest = (int) DB::table('artists')->selectRaw('max(cast(substr(ticket_number, 5) as integer)) as highest')->value('highest');

        return sprintf('ACT-%04d', $highest + 1);
    }
}
