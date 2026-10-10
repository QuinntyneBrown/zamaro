<?php

namespace Database\Seeders;

use App\Enums\ActType;
use App\Enums\ArtistStatus;
use App\Enums\BookingStatus;
use App\Enums\GatheringKind;
use App\Enums\OverrideState;
use App\Enums\Style;
use App\Enums\VscStatus;
use App\Integrations\Routing\CastRoutes;
use App\Models\Artist;
use App\Models\ArtistRating;
use App\Models\AvailabilityOverride;
use App\Models\AvailabilityRule;
use App\Models\Booking;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The cast from docs/mocks/README.md. Today is Fri 9 Oct 2026; the reference search is
 * Sat 14 Nov 2026 · Burlington · Worship night · 120 km. Every row is upserted on its natural key,
 * so running the seeder again changes nothing.
 */
class CastSeeder extends Seeder
{
    /**
     * slug => [name, ticket, act, styles, base, max drive km, from price $, rating, reviews, published]
     */
    private const ARTISTS = [
        'abigail-mensah' => ['Abigail Mensah', 'ACT-0027', ActType::Solo, [Style::SoloVocalist, Style::Hymns], 'Brampton', 120, 650, 4.9, 38, '2025-03-10'],
        'marcus-bell-trio' => ['Marcus Bell Trio', 'ACT-0012', ActType::Band, [Style::Band, Style::Acoustic, Style::Hymns], 'Hamilton', 120, 950, 4.6, 17, '2024-09-02'],
        'hosanna-collective' => ['Hosanna Collective', 'ACT-0015', ActType::Band, [Style::Band, Style::Hymns], 'Mississauga', 120, 1800, 4.8, 21, '2024-11-18'],
        'luz-viva' => ['Luz Viva', 'ACT-0019', ActType::Band, [Style::Band, Style::Acoustic, Style::Spanish], 'North York', 120, 900, 5.0, 6, '2026-02-23'],
        'elijah-park' => ['Elijah Park', 'ACT-0031', ActType::Solo, [Style::SoloVocalist, Style::Acoustic], 'Markham', 120, 350, 4.7, 9, '2025-06-30'],
        'grace-tabernacle-mass-choir' => ['Grace Tabernacle Mass Choir', 'ACT-0008', ActType::Choir, [Style::GospelChoir], 'Scarborough', 120, 2400, 4.8, 26, '2024-05-13'],
        'daniel-and-ruth-okonkwo' => ['Daniel & Ruth Okonkwo', 'ACT-0022', ActType::Duo, [Style::Acoustic, Style::Hymns], 'Ajax', 120, 700, 4.9, 14, '2025-01-20'],
        // Drives up to 40 km; Riverside in Burlington is 48 km away, so she is not in Naomi's lineup.
        'miriam-haile' => ['Miriam Haile', 'ACT-0041', ActType::Solo, [Style::SoloVocalist], 'Etobicoke', 40, 300, null, 0, '2026-10-05'],
    ];

    /** Abigail's calendar: number => [status, date, kind, church, city]. */
    private const ABIGAIL_BOOKINGS = [
        'ZAM-0101' => [BookingStatus::Confirmed, '2026-10-18', GatheringKind::SundayService, 'Living Waters Fellowship', 'Brampton'],
        'ZAM-0104' => [BookingStatus::Confirmed, '2026-11-01', GatheringKind::SundayService, 'St. Brendan’s Anglican', 'Oshawa'],
        'ZAM-0108' => [BookingStatus::Confirmed, '2026-11-15', GatheringKind::SundayService, 'Lakeshore Alliance', 'Oakville'],
        'ZAM-0110' => [BookingStatus::Confirmed, '2026-11-21', GatheringKind::WorshipNight, 'Harvest Point', 'Milton'],
        'ZAM-0116' => [BookingStatus::Confirmed, '2026-12-13', GatheringKind::SundayService, 'Kingdom Life Centre', 'Mississauga'],
        'ZAM-0118' => [BookingStatus::Confirmed, '2026-12-20', GatheringKind::SundayService, 'St. Brendan’s Anglican', 'Oshawa'],
        'ZAM-0114' => [BookingStatus::Requested, '2026-11-14', GatheringKind::WorshipNight, 'Riverside Community Church', 'Burlington'],
        'ZAM-0120' => [BookingStatus::Requested, '2026-11-22', GatheringKind::SundayService, 'Harvest Point', 'Milton'],
        'ZAM-0121' => [BookingStatus::Requested, '2026-12-05', GatheringKind::ConferenceOrRetreat, 'Kingdom Life Centre', 'Mississauga'],
    ];

    private const ABIGAIL_UNAVAILABLE = ['2026-11-26', '2026-11-27', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31'];

    public function run(): void
    {
        DB::transaction(function () {
            foreach (self::ARTISTS as $slug => $row) {
                $this->artist($slug, ...$row);
            }
            $this->abigailsCalendar(Artist::where('slug', 'abigail-mensah')->firstOrFail());
        });
    }

    /**
     * @param  list<Style>  $styles
     */
    private function artist(
        string $slug, string $name, string $ticket, ActType $act, array $styles, string $base,
        int $maxDriveKm, int $fromDollars, ?float $rating, int $reviews, string $published,
    ): void {
        // Cast accounts cannot sign in: the password is random and never shown.
        $user = User::firstOrCreate(['email' => "{$slug}@cast.zamaro.test"], ['name' => $name, 'password' => Str::random(40)]);
        $user->update(['name' => $name]);
        $baseCoordinates = CastRoutes::anchor($base);

        $artist = Artist::updateOrCreate(['slug' => $slug], [
            'user_id' => $user->id,
            'ticket_number' => $ticket,
            'display_name' => $name,
            'act_type' => $act,
            'base_city' => $base,
            'base_latitude' => $baseCoordinates->latitude,
            'base_longitude' => $baseCoordinates->longitude,
            'max_drive_km' => $maxDriveKm,
            'from_price_cents' => $fromDollars * 100,
            'status' => ArtistStatus::Approved,
            'payout_ready' => true,
            'published_at' => $published.' 09:00:00',
        ]);

        DB::table('artist_styles')->where('artist_id', $artist->id)->delete();
        DB::table('artist_styles')->insert(array_map(
            fn (Style $style) => ['artist_id' => $artist->id, 'style' => $style->value],
            $styles,
        ));

        ArtistRating::updateOrCreate(['artist_id' => $artist->id], ['rating' => $rating, 'review_count' => $reviews]);
    }

    private function abigailsCalendar(Artist $abigail): void
    {
        AvailabilityRule::updateOrCreate(['artist_id' => $abigail->id, 'weekday' => 1], ['unavailable' => true]);

        foreach (self::ABIGAIL_UNAVAILABLE as $date) {
            AvailabilityOverride::updateOrCreate(
                ['artist_id' => $abigail->id, 'date' => $date],
                ['state' => OverrideState::Unavailable],
            );
        }

        foreach (self::ABIGAIL_BOOKINGS as $number => [$status, $date, $kind, $church, $city]) {
            Booking::updateOrCreate(['number' => $number], [
                'artist_id' => $abigail->id,
                'status' => $status,
                'event_date' => $date,
                'kind' => $kind,
                'church_name' => $church,
                'church_city' => $city,
            ]);
        }

        VulnerableSectorCheck::updateOrCreate(
            ['user_id' => $abigail->user_id, 'issued_on' => '2025-03-03'],
            ['expires_on' => '2028-03-03', 'status' => VscStatus::Verified, 'verified_at' => '2025-03-05 11:00:00'],
        );
    }
}
