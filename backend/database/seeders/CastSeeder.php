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
use App\Models\Review;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use App\Services\Discovery\Coordinates;
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

    /**
     * number => [artist, status, date, kind, church, city, confirmed at (null if never confirmed)].
     * Abigail has six bookings confirmed this autumn and Marcus one, so Abigail is the headliner.
     */
    private const BOOKINGS = [
        'ZAM-0101' => ['abigail-mensah', BookingStatus::Confirmed, '2026-10-18', GatheringKind::SundayService, 'Living Waters Fellowship', 'Brampton', '2026-09-08 14:00'],
        'ZAM-0104' => ['abigail-mensah', BookingStatus::Confirmed, '2026-11-01', GatheringKind::SundayService, 'Harvest Point Church', 'Milton', '2026-09-15 11:20'],
        'ZAM-0108' => ['abigail-mensah', BookingStatus::Confirmed, '2026-11-15', GatheringKind::SundayService, 'Lakeshore Alliance', 'Oakville', '2026-09-22 16:05'],
        'ZAM-0110' => ['abigail-mensah', BookingStatus::Confirmed, '2026-11-21', GatheringKind::WorshipNight, 'Kingdom Life Centre', 'Mississauga', '2026-09-29 10:40'],
        'ZAM-0116' => ['abigail-mensah', BookingStatus::Confirmed, '2026-12-13', GatheringKind::SundayService, 'Living Waters Fellowship', 'Brampton', '2026-10-01 13:15'],
        'ZAM-0118' => ['abigail-mensah', BookingStatus::Confirmed, '2026-12-20', GatheringKind::SundayService, 'Lakeshore Alliance', 'Oakville', '2026-10-06 09:30'],
        'ZAM-0114' => ['abigail-mensah', BookingStatus::Requested, '2026-11-14', GatheringKind::WorshipNight, 'Riverside Community Church', 'Burlington', null],
        'ZAM-0120' => ['abigail-mensah', BookingStatus::Requested, '2026-11-22', GatheringKind::SundayService, 'Harvest Point Church', 'Milton', null],
        'ZAM-0121' => ['abigail-mensah', BookingStatus::Requested, '2026-12-05', GatheringKind::ConferenceOrRetreat, 'Kingdom Life Centre', 'Mississauga', null],
        // Completed engagements behind Abigail's profile reviews (confirmed before this season).
        'ZAM-0052' => ['abigail-mensah', BookingStatus::Completed, '2026-05-10', GatheringKind::SundayService, 'Living Waters Fellowship', 'Brampton', '2026-04-08 10:00'],
        'ZAM-0061' => ['abigail-mensah', BookingStatus::Completed, '2026-06-14', GatheringKind::SundayService, 'Riverside Community Church', 'Burlington', '2026-05-20 10:00'],
        'ZAM-0078' => ['abigail-mensah', BookingStatus::Completed, '2026-08-16', GatheringKind::SundayService, 'Harvest Point Church', 'Milton', '2026-07-10 10:00'],
        'ZAM-0089' => ['abigail-mensah', BookingStatus::Completed, '2026-09-13', GatheringKind::SundayService, 'St. Brendan’s Anglican', 'Oshawa', '2026-08-12 10:00'],
        'ZAM-0097' => ['marcus-bell-trio', BookingStatus::Confirmed, '2026-10-25', GatheringKind::SundayService, 'Riverside Community Church', 'Burlington', '2026-09-18 15:00'],
    ];

    /** booking number => [reviewer, account, stars, written at, text] (docs/mocks/pages/artist). */
    private const REVIEWS = [
        'ZAM-0089' => ['Rev. Janet Clarke', 'janet-clarke', 5, '2026-09-15 19:00', 'She had the whole congregation singing in three-part harmony by the last verse.'],
        'ZAM-0078' => ['Tomi Oduya', 'tomi-oduya', 5, '2026-08-18 20:00', 'She rehearsed with our volunteer band on Saturday and made them sound like pros on Sunday.'],
        'ZAM-0061' => ['Naomi Fraser', 'naomi-fraser', 5, '2026-06-16 18:00', 'Our seniors asked for hymns and our youth asked for Jireh.'],
        'ZAM-0052' => ['Pastor Femi Adebayo', 'femi-adebayo', 4, '2026-05-12 17:00', 'Wonderful voice and a real pastor’s heart.'],
    ];

    private const SUPPORTING_CAST = [
        'Kempenfelt Worship Collective', 'Allandale Gospel Singers', 'Simcoe Street Praise Band',
        'Minets Point Trio', 'Painswick Hymn Choir', 'Georgian Voices', 'Shanty Bay Strings',
        'Heritage Park Praise', 'Bayfield Worship Band', 'Holly Choir of Barrie', 'Little Lake Acoustic',
        'Ardagh Bluffs Ensemble', 'Sunnidale Singers', 'Innisfil Beach Worship', 'Oro Valley Voices',
        'Midhurst Praise Collective', 'Springwater Hymn Duo', 'Wasaga Light Worship', 'Lefroy Gospel Choir',
        'Stroud Harmony', 'Cundles Road Band', 'Grove Street Worship', 'Mapleview Praise',
        'East Bayfield Acoustic', 'Letitia Heights Choir', 'Tollendale Worship Duo', 'Queens Park Singers',
        'Codrington Praise Band', 'Victoria Village Voices', 'Lampman Lane Worship',
    ];

    private const ABIGAIL_UNAVAILABLE = ['2026-11-26', '2026-11-27', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31'];

    public function run(): void
    {
        DB::transaction(function () {
            foreach (self::ARTISTS as $slug => $row) {
                $this->artist($slug, ...$row);
            }
            $this->abigailsCalendar(Artist::where('slug', 'abigail-mensah')->firstOrFail());
            $this->bookings();
            $this->reviews();
            $this->supportingCast();
            $this->christmasChoirs();
        });
    }

    /**
     * Gospel choirs for the sold-out state (L2-011, docs/mocks/pages/discover/empty.html). Each is
     * unavailable every weekday and free only on the dates below, so no other search changes:
     * within 40 km of Burlington none is free on Christmas Eve, one is on Wed 23 Dec, three on
     * Sun 27 Dec and two on Sun 20 Dec; Durham (Ajax, 97 km) and Grace Tabernacle (81 km) make
     * two free within 120 km on Christmas Eve.
     */
    private function christmasChoirs(): void
    {
        $choirs = [
            'lakeshore-gospel-voices' => ['Lakeshore Gospel Voices', 'ACT-0061', new Coordinates(43.4675, -79.6877), 1500, 4.7, 12, ['2026-12-20', '2026-12-23', '2026-12-27']],
            'hamilton-mountain-mass-choir' => ['Hamilton Mountain Mass Choir', 'ACT-0062', new Coordinates(43.21, -79.86), 1700, 4.8, 15, ['2026-12-20', '2026-12-27']],
            'halton-praise-choir' => ['Halton Praise Choir', 'ACT-0063', new Coordinates(43.5183, -79.8774), 1200, 4.5, 8, ['2026-12-27']],
            'durham-gospel-choir' => ['Durham Gospel Choir', 'ACT-0064', CastRoutes::anchor('Ajax'), 1900, 4.6, 10, ['2026-12-24']],
        ];
        foreach ($choirs as $slug => [$name, $ticket, $at, $fromDollars, $rating, $reviews, $freeDates]) {
            $this->artist($slug, $name, $ticket, ActType::Choir, [Style::GospelChoir], 'Burlington', 120, $fromDollars, $rating, $reviews, '2025-11-01', $at);
            $choir = Artist::where('slug', $slug)->firstOrFail();
            foreach (range(1, 7) as $weekday) {
                AvailabilityRule::updateOrCreate(['artist_id' => $choir->id, 'weekday' => $weekday], ['unavailable' => true]);
            }
            foreach ($freeDates as $date) {
                AvailabilityOverride::updateOrCreate(['artist_id' => $choir->id, 'date' => $date], ['state' => OverrideState::Free]);
            }
        }
    }

    /**
     * Thirty artists around Barrie, for paging (L2-010): all free on Sat 14 Nov within 40 km of
     * Barrie, and more than 120 km by road from Burlington, so Naomi's lineup is unchanged. Styles,
     * prices and ratings vary by position; every seventh has no reviews yet.
     */
    private function supportingCast(): void
    {
        $barrie = CastRoutes::anchor('Barrie');
        $styles = [[Style::Band, Style::Hymns], [Style::SoloVocalist, Style::Acoustic], [Style::GospelChoir], [Style::Acoustic, Style::Spanish], [Style::Band]];
        $acts = [ActType::Band, ActType::Solo, ActType::Choir, ActType::Duo, ActType::Band];
        foreach (self::SUPPORTING_CAST as $index => $name) {
            $reviewed = ($index + 1) % 7 !== 0;
            $this->artist(
                Str::slug($name), $name, sprintf('ACT-%04d', 1001 + $index), $acts[$index % 5], $styles[$index % 5], 'Barrie',
                120, 300 + ($index * 37 % 20) * 100, $reviewed ? round(4.0 + ($index * 13 % 11) / 10, 1) : null,
                $reviewed ? 3 + $index * 7 % 30 : 0, '2025-09-01',
                new Coordinates($barrie->latitude + ($index % 6) * 0.004, $barrie->longitude + intdiv($index, 6) * 0.006),
            );
        }
    }

    private function bookings(): void
    {
        foreach (self::BOOKINGS as $number => [$slug, $status, $date, $kind, $church, $city, $confirmedAt]) {
            $booking = Booking::updateOrCreate(['number' => $number], [
                'artist_id' => Artist::where('slug', $slug)->value('id'),
                'status' => $status,
                'event_date' => $date,
                'kind' => $kind,
                'church_name' => $church,
                'church_city' => $city,
            ]);
            if ($confirmedAt !== null) {
                DB::table('booking_transitions')->updateOrInsert(
                    ['booking_id' => $booking->id, 'to_status' => BookingStatus::Confirmed->value],
                    ['from_status' => BookingStatus::Accepted->value, 'actor_kind' => 'booker', 'occurred_at' => $confirmedAt],
                );
            }
        }
    }

    private function reviews(): void
    {
        foreach (self::REVIEWS as $number => [$reviewer, $account, $stars, $writtenAt, $text]) {
            $booker = User::firstOrCreate(['email' => "{$account}@cast.zamaro.test"], ['name' => $reviewer, 'password' => Str::random(40)]);
            $booking = Booking::where('number', $number)->firstOrFail();
            Review::updateOrCreate(['booking_id' => $booking->id], [
                'artist_id' => $booking->artist_id,
                'booker_id' => $booker->id,
                'stars' => $stars,
                'text' => $text,
                'created_at' => $writtenAt,
            ]);
        }
    }

    /**
     * @param  list<Style>  $styles
     */
    private function artist(
        string $slug, string $name, string $ticket, ActType $act, array $styles, string $base,
        int $maxDriveKm, int $fromDollars, ?float $rating, int $reviews, string $published,
        ?Coordinates $at = null,
    ): void {
        // Cast accounts cannot sign in: the password is random and never shown.
        $user = User::firstOrCreate(['email' => "{$slug}@cast.zamaro.test"], ['name' => $name, 'password' => Str::random(40)]);
        $user->update(['name' => $name]);
        $baseCoordinates = $at ?? CastRoutes::anchor($base);

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

        VulnerableSectorCheck::updateOrCreate(
            ['user_id' => $abigail->user_id, 'issued_on' => '2025-03-03'],
            ['expires_on' => '2028-03-03', 'status' => VscStatus::Verified, 'verified_at' => '2025-03-05 11:00:00'],
        );
    }
}
