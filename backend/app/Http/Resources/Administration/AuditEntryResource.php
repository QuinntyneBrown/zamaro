<?php

namespace App\Http\Resources\Administration;

use App\Models\Artist;
use App\Models\AuditEntry;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * One audit log row as the admin viewer shows it: when, who (or "System" / "Unknown"), what, to
 * what, from where, and how it ended (administration/record-audit-log). Context never leaves the
 * server beyond the attempted email of a failed sign-in.
 *
 * @property AuditEntry $resource
 */
class AuditEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $entry = $this->resource;
        $actor = $entry->actor;

        return [
            'id' => $entry->id,
            /**
             * When it happened, Toronto time, ISO 8601.
             *
             * @var string
             */
            'occurredAt' => $entry->occurred_at->setTimezone(config('app.timezone'))->toIso8601String(),
            /** Who did it; null for the system (no address) or an unknown sign-in (an address and an attempted email). */
            'actor' => $actor === null ? null : [
                'name' => $actor->name,
                'email' => $actor->email,
                /** @var 'booker'|'artist'|'admin'|null */
                'role' => $entry->actor_role,
            ],
            /** The email a failed sign-in tried, when it belongs to no account. */
            'attemptedEmail' => $actor === null ? ($entry->context['email'] ?? null) : null,
            /** The action code: `auth.sign_in_failed`. */
            'action' => $entry->action->value,
            /** What it acted on: "User · Priya Nair", "Booking · ZAM-0101"; null when nothing. */
            'target' => $entry->target_type === null ? null : [
                'type' => self::typeLabel($entry->target_type),
                /** The record's name or number; null once the record is gone. */
                'label' => self::label($entry->target),
            ],
            /** The client's address, or null for a queued job. */
            'ipAddress' => $entry->ip_address,
            /** @var 'succeeded'|'failed'|'denied' */
            'outcome' => $entry->outcome->value,
        ];
    }

    /** "User", "Booking", "Review report". */
    private static function typeLabel(string $morphClass): string
    {
        return Str::ucfirst(Str::lower(Str::headline(class_basename($morphClass))));
    }

    private static function label(?Model $target): ?string
    {
        return match (true) {
            $target instanceof User => $target->name,
            $target instanceof Artist => $target->display_name,
            $target instanceof Booking => $target->number,
            default => null,
        };
    }
}
