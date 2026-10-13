<?php

namespace Database\Seeders;

use App\Enums\ActType;
use App\Enums\ArtistStatus;
use App\Enums\BookingStatus;
use App\Enums\ConsentKind;
use App\Enums\ConsentSource;
use App\Enums\GatheringKind;
use App\Enums\MusicalKey;
use App\Enums\OverrideState;
use App\Enums\Pronoun;
use App\Enums\Role;
use App\Enums\Style;
use App\Enums\VideoStatus;
use App\Enums\VscStatus;
use App\Integrations\Routing\CastRoutes;
use App\Jobs\Reviews\RecalculateArtistRating;
use App\Models\Artist;
use App\Models\ArtistPhoto;
use App\Models\ArtistRating;
use App\Models\ArtistVideo;
use App\Models\AvailabilityOverride;
use App\Models\AvailabilityRule;
use App\Models\Booking;
use App\Models\Church;
use App\Models\ConsentRecord;
use App\Models\Review;
use App\Models\ReviewReply;
use App\Models\SetlistSong;
use App\Models\SlugHistory;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use App\Services\ArtistOnboarding\DocumentVault;
use App\Services\Discovery\Coordinates;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        'miriam-haile' => ['Miriam Haile', 'ACT-0154', ActType::Solo, [Style::SoloVocalist], 'Etobicoke', 40, 300, null, 0, '2026-10-05'],
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
        'ZAM-0061' => ['Naomi Fraser', 'naomi-fraser', 5, '2026-06-16 18:00', 'Our seniors asked for hymns and our youth asked for Jireh. She gave both, and somehow it felt like one service.'],
        'ZAM-0052' => ['Pastor Femi Adebayo', 'femi-adebayo', 4, '2026-05-12 17:00', 'Wonderful voice and a real pastor’s heart. Gracious about our tiny sound desk.'],
    ];

    /**
     * The cast who can sign in (docs/mocks/README.md, M2 plan D28): account => their own address.
     * Everyone else keeps a `{account}@cast.zamaro.test` address and a random password.
     */
    private const SIGN_IN = [
        'naomi-fraser' => 'naomi.fraser@riversidecc.ca',
        'abigail-mensah' => 'abigail@abigailmensah.ca',
        'tomi-oduya' => 'tomi.oduya@harvestpointchurch.ca',
    ];

    /**
     * Artists whose account address the admin mocks show (pages/admin-artist); everyone else keeps
     * `{account}@cast.zamaro.test`. Tobi Adeyemi's arrives with his application (S11).
     */
    private const MOCK_EMAILS = [
        'marcus-bell-trio' => 'marcus@marcusbelltrio.ca',
    ];

    /** slug => when the application was approved, where the mocks say (pages/admin-artist); else the publish date. */
    private const APPROVED = [
        'marcus-bell-trio' => '2026-03-02 09:00:00',
    ];

    /**
     * Priya Nair, the Zamaro team's administrator (docs/mocks/pages/admin-*). She exists only where the
     * cast can sign in, with two-step sign-in on and this key, so the admin e2e specs compute her codes
     * (e2e/fixtures/accounts.ts holds the same key). Production administrators are made by
     * `zamaro:admin:grant` (M3 D6).
     */
    public const PRIYA_EMAIL = 'priya@zamaro.ca';

    public const PRIYA_TOTP_SECRET = 'ZAMAROADMINPRIYANAIRTOTPKEY23456';

    /** booking number => [replied at, text]: Abigail's replies (docs/mocks/pages/artist-reviews). */
    private const REPLIES = [
        'ZAM-0078' => ['2026-10-08 11:20', 'Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov.'],
        'ZAM-0061' => ['2026-06-16 21:00', 'Riverside, you sang the roof off. Thank you for having me.'],
    ];

    /**
     * [reviewer, church, city]: the other 34 churches behind Abigail's 4.9 from 38 churches. Their
     * reviews are older than the four on her profile; every seventh gives 4 stars and the rest 5,
     * so the 38 reviews sum to 185 stars, a mean of 4.87 (L2-060).
     */
    private const EARLIER_REVIEWERS = [
        ['Pastor Samuel Osei', 'Cornerstone Baptist', 'Scarborough'],
        ['Ruth Kim', 'Agincourt Community Church', 'Scarborough'],
        ['Rev. Michael Grant', 'St. Jude’s Anglican', 'Oakville'],
        ['Esther Mwale', 'Bethel Pentecostal', 'Hamilton'],
        ['Pastor Daniel Ruiz', 'Iglesia La Roca', 'North York'],
        ['Joy Asante', 'Victory Chapel', 'Brampton'],
        ['Rev. Carol Henderson', 'Knox Presbyterian', 'Guelph'],
        ['Pastor Kwame Boateng', 'Grace Assembly', 'Ajax'],
        ['Linda Tran', 'Hope City Church', 'Markham'],
        ['Rev. Paul Whitfield', 'St. Andrew’s United', 'Burlington'],
        ['Deborah Osei-Bonsu', 'Calvary Gospel Church', 'Whitby'],
        ['Pastor Mark Chen', 'Living Stones Church', 'Richmond Hill'],
        ['Sarah MacLeod', 'Westminster Chapel', 'Mississauga'],
        ['Pastor Tunde Bakare', 'House of Praise', 'Etobicoke'],
        ['Rev. Anne Doucette', 'Trinity Anglican', 'Cambridge'],
        ['Joseph Mensah', 'Mount Zion Church', 'Pickering'],
        ['Pastor Grace Lee', 'New Hope Fellowship', 'Vaughan'],
        ['Rev. David Ellis', 'Christ Church', 'Georgetown'],
        ['Abena Owusu', 'Faith Tabernacle', 'Oshawa'],
        ['Pastor James Wright', 'The Meeting House', 'Kitchener'],
        ['Rev. Patricia Moore', 'St. Paul’s United', 'Milton'],
        ['Pastor Emmanuel Nwosu', 'Redeemed Life Centre', 'Brampton'],
        ['Hannah Schultz', 'Lakeview Baptist', 'Mississauga'],
        ['Pastor Robert Singh', 'Fountain of Life', 'Malton'],
        ['Rev. Elizabeth Ford', 'All Saints Anglican', 'Waterloo'],
        ['Pastor Isaac Darko', 'Shiloh Worship Centre', 'Toronto'],
        ['Miriam Goldberg', 'Emmanuel Church', 'Newmarket'],
        ['Pastor Andrew Clarke', 'Harbour Light Church', 'Port Credit'],
        ['Rev. Susan Bell', 'St. Mark’s Lutheran', 'Kitchener'],
        ['Pastor Femi Ogunleye', 'Kingdom Hall of Praise', 'Scarborough'],
        ['Catherine Wong', 'Pacific Grace Church', 'Richmond Hill'],
        ['Pastor Peter Nkansah', 'Restoration Church', 'Bowmanville'],
        ['Rev. Thomas Hughes', 'Grace United', 'Brantford'],
        ['Adwoa Mensah-Bonsu', 'Bread of Life Church', 'Ajax'],
    ];

    /** Rotated through the earlier reviews. */
    private const EARLIER_TEXTS = [
        'Our whole congregation is still humming the songs she led.',
        'She arrived early, rehearsed with our team and led with real humility.',
        'Beautiful voice, clear communication before the day, and right on time.',
        'She chose songs our older members knew and taught us two new ones.',
        'A worship night our youth keep asking us to repeat.',
        'She prayed with our team before the service. It set the tone for everything.',
    ];

    /**
     * slug => [pronoun, headline, About heading, bio, languages, setlist [title, writer, key]]
     * (docs/mocks/pages/artist, docs/mocks/pages/edit-profile).
     */
    private const PROFILES = [
        'abigail-mensah' => [Pronoun::She, 'Gospel & contemporary vocalist', 'Raised in the choir loft',
            "I grew up in my mother’s church in Brampton, learning harmonies from aunties who never needed a microphone. I’ve led worship at New Covenant Chapel for nine years.\n\nI lead in English and Twi, bring my own tracks if you don’t have a band, and I’m happy to rehearse with your volunteers. My aim is a congregation that sings.",
            ['en', 'tw'], [
                ['Way Maker', 'Sinach', MusicalKey::E],
                ['Goodness of God', 'Bethel Music', MusicalKey::A],
                ['Great Is Thy Faithfulness', 'Thomas Chisholm, 1923', MusicalKey::D],
                ['Jireh', 'Elevation & Maverick City', MusicalKey::BFlat],
                ['Blessed Assurance', 'Fanny Crosby', MusicalKey::D],
                ['Build My Life', 'Pat Barrett', MusicalKey::G],
                ['Oceans (Where Feet May Fail)', 'Hillsong United', MusicalKey::D],
                ['Twi praise medley', 'Traditional Ghanaian', MusicalKey::F],
            ]],
        'miriam-haile' => [Pronoun::She, 'Solo vocalist & pianist', 'Piano first, then the song',
            "I learned piano before I ever sang in public, and I still lead from the keys.\n\nI’m new to Zamaro and glad to help small congregations find their voice.",
            ['en', 'am'], [
                ['Goodness of God', 'Bethel Music', MusicalKey::A],
                ['It Is Well With My Soul', 'Horatio Spafford, 1873', MusicalKey::C],
                ['Abide With Me', 'Henry F. Lyte, 1847', MusicalKey::EFlat],
                ['Firm Foundation', 'Cody Carnes', MusicalKey::B],
            ]],
        'marcus-bell-trio' => [Pronoun::They, 'Piano, upright bass and drums', null,
            'Three friends from Hamilton who play hymns the way a jazz trio would, and still leave room for the congregation.',
            ['en'], [['Great Is Thy Faithfulness', 'Thomas Chisholm, 1923', MusicalKey::D], ['Goodness of God', 'Bethel Music', MusicalKey::A]]],
        'hosanna-collective' => [Pronoun::They, 'Contemporary worship band', null,
            'A seven-piece band from Mississauga that brings its own sound and lights.',
            ['en'], [['Build My Life', 'Pat Barrett', MusicalKey::G], ['Way Maker', 'Sinach', MusicalKey::E]]],
        'luz-viva' => [Pronoun::They, 'Bilingual worship band', null,
            'We lead in Spanish and English, for congregations that pray in both.',
            ['en', 'es'], [['Cuán Grande es Él', 'Carl Boberg', MusicalKey::BFlat], ['Way Maker', 'Sinach', MusicalKey::E]]],
        'elijah-park' => [Pronoun::He, 'Acoustic worship leader', null,
            'One voice and one guitar, for gatherings that want to hear every word.',
            ['en', 'ko'], [['Firm Foundation', 'Cody Carnes', MusicalKey::B], ['It Is Well With My Soul', 'Horatio Spafford, 1873', MusicalKey::C]]],
        'grace-tabernacle-mass-choir' => [Pronoun::They, 'Gospel mass choir', null,
            'Forty voices from Scarborough for the nights a congregation wants to be carried.',
            ['en'], [['Total Praise', 'Richard Smallwood', MusicalKey::AFlat], ['Oh Happy Day', 'Edwin Hawkins', MusicalKey::G]]],
        'daniel-and-ruth-okonkwo' => [Pronoun::They, 'Husband-and-wife worship duo', null,
            'Two voices in harmony, with guitar and keys, from Ajax.',
            ['en'], [['Blessed Assurance', 'Fanny Crosby', MusicalKey::D], ['Goodness of God', 'Bethel Music', MusicalKey::A]]],
    ];

    /** slug => alt text per photo, in order (docs/mocks/pages/artist). MediaSeeder writes the files. */
    private const PHOTOS = [
        'abigail-mensah' => [
            'Abigail at the microphone during a Sunday service',
            'Abigail rehearsing with a church volunteer band',
            'Portrait of Abigail smiling in a kente scarf',
            'Abigail leading a youth night from the floor, not the stage',
        ],
        'miriam-haile' => [
            'Miriam at the piano during a Sunday evening service',
            'Portrait of Miriam in a white netela shawl',
        ],
    ];

    /**
     * slug => [title, seconds, status, captioned] in order (docs/mocks/pages/artist,
     * docs/mocks/pages/edit-profile/video-processing). Every live video plays the one sample stream.
     */
    private const VIDEOS = [
        'abigail-mensah' => [
            ['Way Maker — live at Bethel Pentecostal, Hamilton', 372, VideoStatus::Live, true],
            ['Great Is Thy Faithfulness — acoustic', 280, VideoStatus::Live, false],
            ['Twi praise medley — Harvest Sunday 2025', 485, VideoStatus::Live, true],
            ['Goodness of God — women’s retreat, Muskoka', 330, VideoStatus::Live, true],
            ['Jireh — live at Living Waters, Brampton', 462, VideoStatus::Processing, false],
        ],
    ];

    /** Seeded photos are 4:3; renditions keep the ratio at each width (L2-051). */
    private const PHOTO_WIDTHS = [400, 800, 1200, 1600];

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

    /** retired slug => [artist, retired at]: old addresses that answer 301 (L2-021.3, L2-055.3). */
    private const RETIRED_SLUGS = [
        'abigail-sings' => ['abigail-mensah', '2026-03-02 12:00:00'],
    ];

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
            $this->suspendedVocalist();
            $this->retiredSlugs();
            $this->profiles();
            $this->media();
            $this->accounts();
            $this->administrators();
            $this->pendingChecks();
            $this->consents();
            $this->churches();
            $this->savedArtists();
        });
    }

    /**
     * Who may do what: every church person is a Booker and every artist an Artist. Naomi, Abigail
     * and Tomi have verified addresses and, outside production, sign in with ZAMARO_CAST_PASSWORD.
     */
    private function accounts(): void
    {
        $roleIds = DB::table('roles')->pluck('id', 'name');
        $artistUserIds = Artist::pluck('user_id');
        DB::table('role_user')->insertOrIgnore(User::where('email', '!=', self::PRIYA_EMAIL)->pluck('id')->map(fn (int $id) => [
            'user_id' => $id,
            'role_id' => $roleIds[$artistUserIds->contains($id) ? Role::Artist->value : Role::Booker->value],
        ])->all());

        $password = config('zamaro.cast_password');
        $canSignIn = filled($password) && app()->environment(['local', 'testing', 'e2e']);
        foreach (self::SIGN_IN as $email) {
            User::where('email', $email)->update([
                'email_verified_at' => '2026-09-01 12:00:00',
                'password' => Hash::make($canSignIn ? $password : Str::random(40)),
            ]);
        }
    }

    /**
     * Priya Nair: an Administrator and nothing else, with two-step sign-in on (L2-066.2). Seeded only
     * where the cast can sign in, with the cast password and a fixed key.
     */
    private function administrators(): void
    {
        $password = config('zamaro.cast_password');
        if (blank($password) || ! app()->environment(['local', 'testing', 'e2e'])) {
            return;
        }
        $priya = User::firstOrNew(['email' => self::PRIYA_EMAIL]);
        $priya->forceFill([
            'name' => 'Priya Nair',
            'password' => Hash::make($password),
            'email_verified_at' => '2026-09-01 12:00:00',
            'mfa_enabled' => true,
            'two_factor_secret' => self::PRIYA_TOTP_SECRET,
            'two_factor_confirmed_at' => '2026-09-01 12:05:00',
        ])->save();
        $priya->grantRoles([Role::Administrator]);
    }

    /**
     * What the cast agreed to (L2-080): Naomi and Abigail accepted the October terms and privacy policy
     * and said no to marketing email; Tomi last accepted the March terms, so the terms gate stops him
     * (M2 S14).
     * Written once per person, as records are never changed.
     */
    private function consents(): void
    {
        $consents = [
            'naomi.fraser@riversidecc.ca' => ['2026-10-08 09:30:00', [
                [ConsentKind::Terms, '2026-10', true], [ConsentKind::PrivacyPolicy, '2026-10', true], [ConsentKind::MarketingEmail, null, false],
            ]],
            'abigail@abigailmensah.ca' => ['2026-10-08 12:00:00', [
                [ConsentKind::Terms, '2026-10', true], [ConsentKind::PrivacyPolicy, '2026-10', true], [ConsentKind::MarketingEmail, null, false],
            ]],
            'tomi.oduya@harvestpointchurch.ca' => ['2026-03-04 19:15:00', [
                [ConsentKind::Terms, '2026-03', true], [ConsentKind::PrivacyPolicy, '2026-03', true], [ConsentKind::MarketingEmail, null, false],
            ]],
        ];
        foreach ($consents as $email => [$at, $items]) {
            $user = User::where('email', $email)->firstOrFail();
            if (ConsentRecord::where('user_id', $user->id)->exists()) {
                continue;
            }
            foreach ($items as [$kind, $version, $granted]) {
                ConsentRecord::create([
                    'user_id' => $user->id, 'kind' => $kind, 'document_version' => $version, 'granted' => $granted,
                    'recorded_at' => $at, 'source' => ConsentSource::Registration,
                ]);
            }
        }
    }

    /**
     * The churches of the bookers who sign in (accounts/manage-church-profile), and Abigail's private
     * contact phone (L2-025.4). Phones are encrypted by the models' casts (L2-079.2). Harvest Point's
     * street is not in the mocks; it is a Milton address the fake geocoder knows.
     */
    private function churches(): void
    {
        $churches = [
            'naomi.fraser@riversidecc.ca' => [
                'name' => 'Riverside Community Church', 'street_address' => '2150 Lakeshore Road', 'city' => 'Burlington',
                'postal_code' => 'L7R 1A3', 'phone' => '+19055550123', 'denomination' => 'Non-denominational',
                'typical_attendance' => 350, 'town' => 'Burlington',
            ],
            'tomi.oduya@harvestpointchurch.ca' => [
                'name' => 'Harvest Point Church', 'street_address' => '8150 Main Street East', 'city' => 'Milton',
                'postal_code' => 'L9T 1A1', 'phone' => '+19055550177', 'denomination' => null,
                'typical_attendance' => 220, 'town' => 'Milton',
            ],
        ];
        foreach ($churches as $email => $church) {
            $point = CastRoutes::anchor($church['town']);
            unset($church['town']);
            Church::updateOrCreate(['booker_id' => User::where('email', $email)->value('id')], [
                ...$church, 'province' => 'ON', 'latitude' => $point->latitude, 'longitude' => $point->longitude,
            ]);
        }

        Artist::where('slug', 'abigail-mensah')->firstOrFail()->update(['contact_phone' => '+19055550148']);
    }

    /**
     * Naomi's saved artists, newest first on the list (accounts/view-saved-artists): Abigail on Wed 7
     * Oct, Hosanna Collective on Sun 27 Sep and Luz Viva on Sat 12 Sep.
     */
    private function savedArtists(): void
    {
        $naomi = User::where('email', 'naomi.fraser@riversidecc.ca')->firstOrFail();
        $saved = ['abigail-mensah' => '2026-10-07 20:14:00', 'hosanna-collective' => '2026-09-27 15:40:00', 'luz-viva' => '2026-09-12 11:05:00'];
        foreach ($saved as $slug => $at) {
            DB::table('saved_artists')->insertOrIgnore([
                'user_id' => $naomi->id, 'artist_id' => Artist::where('slug', $slug)->value('id'),
                'created_at' => Carbon::parse($at, 'America/Toronto')->toIso8601String(),
            ]);
        }
        $naomi->forceFill(['first_saved_at' => Carbon::parse('2026-09-12 11:05:00', 'America/Toronto')])->save();
    }

    /**
     * A cast member's account, found by their own address or the cast one and moved to their own,
     * so the seeder can run again on a database seeded before they could sign in.
     */
    private function castUser(string $account, string $name): User
    {
        $cast = "{$account}@cast.zamaro.test";
        $email = self::SIGN_IN[$account] ?? self::MOCK_EMAILS[$account] ?? $cast;
        $user = User::whereIn('email', array_unique([$email, $cast]))->orderByRaw('email = ? desc', [$email])->first()
            ?? User::create(['email' => $email, 'name' => $name, 'password' => Str::random(40)]);
        $user->update(['email' => $email, 'name' => $name]);

        return $user;
    }

    /**
     * Selah Brooks, a solo vocalist suspended from Zamaro, for the not-found page (L2-021.2): her
     * address answers the same 404 as one that never existed, suggesting free solo vocalists.
     */
    private function suspendedVocalist(): void
    {
        $this->artist('selah-brooks', 'Selah Brooks', 'ACT-0044', ActType::Solo, [Style::SoloVocalist, Style::Hymns], 'Mississauga', 120, 500, 4.4, 5, '2025-04-14');
        Artist::where('slug', 'selah-brooks')->update(['status' => ArtistStatus::Suspended]);
    }

    private function retiredSlugs(): void
    {
        foreach (self::RETIRED_SLUGS as $slug => [$artist, $retiredAt]) {
            SlugHistory::updateOrCreate(['slug' => $slug], [
                'artist_id' => Artist::where('slug', $artist)->value('id'),
                'retired_at' => $retiredAt,
            ]);
        }
    }

    /** Rows only; the keys point at files MediaSeeder writes to the media disk. */
    private function media(): void
    {
        foreach (self::PHOTOS as $slug => $alts) {
            $artistId = Artist::where('slug', $slug)->value('id');
            foreach ($alts as $index => $alt) {
                $position = $index + 1;
                $renditions = [];
                foreach (['avif', 'webp'] as $format) {
                    foreach (self::PHOTO_WIDTHS as $width) {
                        $renditions[] = ['width' => $width, 'format' => $format, 'key' => "artists/{$slug}/photos/{$position}-{$width}.{$format}"];
                    }
                }
                ArtistPhoto::updateOrCreate(
                    ['artist_id' => $artistId, 'position' => $position],
                    ['alt_text' => $alt, 'renditions' => $renditions, 'width' => 1600, 'height' => 1200],
                );
            }
        }

        foreach (self::VIDEOS as $slug => $videos) {
            $artistId = Artist::where('slug', $slug)->value('id');
            foreach ($videos as $index => [$title, $seconds, $status, $captioned]) {
                $position = $index + 1;
                $live = $status === VideoStatus::Live;
                ArtistVideo::updateOrCreate(['artist_id' => $artistId, 'position' => $position], [
                    'title' => $title,
                    'status' => $status,
                    'duration_seconds' => $seconds,
                    'manifest_key' => $live ? MediaSeeder::SAMPLE_STREAM : null,
                    'captions_key' => $live && $captioned ? MediaSeeder::SAMPLE_CAPTIONS : null,
                    'poster_key' => $live ? "artists/{$slug}/videos/{$position}-poster-800.webp" : null,
                ]);
            }
        }
    }

    private function profiles(): void
    {
        foreach (self::PROFILES as $slug => [$pronoun, $headline, $aboutHeading, $bio, $languages, $songs]) {
            $artist = Artist::where('slug', $slug)->firstOrFail();
            $artist->update([
                'pronoun' => $pronoun,
                'headline' => $headline,
                'about_heading' => $aboutHeading,
                'bio' => $bio,
                'languages' => $languages,
            ]);
            foreach ($songs as $index => [$title, $writer, $key]) {
                SetlistSong::updateOrCreate(
                    ['artist_id' => $artist->id, 'position' => $index + 1],
                    ['title' => $title, 'writer' => $writer, 'key' => $key],
                );
            }
        }
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
            $booker = $this->castUser($account, $reviewer);
            $booking = Booking::where('number', $number)->firstOrFail();
            Review::updateOrCreate(['booking_id' => $booking->id], [
                'artist_id' => $booking->artist_id,
                'booker_id' => $booker->id,
                'stars' => $stars,
                'text' => $text,
                'created_at' => $writtenAt,
            ]);
        }

        foreach (self::REPLIES as $number => [$repliedAt, $text]) {
            $review = Review::whereRelation('booking', 'number', $number)->firstOrFail();
            ReviewReply::updateOrCreate(['review_id' => $review->id], [
                'artist_id' => $review->artist_id,
                'text' => $text,
                'created_at' => $repliedAt,
            ]);
        }

        $abigail = Artist::where('slug', 'abigail-mensah')->firstOrFail();
        $this->earlierReviews($abigail);
        // Her summary comes from the reviews, as the worker keeps it; the rest of the cast keeps
        // the seeded summaries in ARTISTS, which have no reviews behind them yet.
        RecalculateArtistRating::dispatchSync($abigail->id);
    }

    /**
     * Abigail's older reviews, one per church, each behind a completed Sunday booking: the newest
     * on Tue 5 May 2026, then a week apart. Bulk upserts on the natural keys keep reseeding (and
     * every test's setup) quick.
     */
    private function earlierReviews(Artist $abigail): void
    {
        $now = now();
        $lastSunday = Carbon::parse('2026-05-03');
        $users = $bookings = $reviews = [];
        foreach (self::EARLIER_REVIEWERS as $index => [$name, $church, $city]) {
            $email = Str::slug($name).'@cast.zamaro.test';
            $number = sprintf('ZAM-%04d', $index + 1);
            $eventDate = $lastSunday->copy()->subWeeks($index);
            $users[$email] = ['name' => $name, 'email' => $email, 'created_at' => $now, 'updated_at' => $now];
            $bookings[$number] = [
                'number' => $number, 'artist_id' => $abigail->id, 'status' => BookingStatus::Completed->value,
                'event_date' => $eventDate->toDateString(), 'kind' => GatheringKind::SundayService->value,
                'church_name' => $church, 'church_city' => $city, 'created_at' => $now, 'updated_at' => $now,
            ];
            $reviews[$number] = [
                'email' => $email,
                'stars' => $index % 7 === 6 ? 4 : 5,
                'text' => self::EARLIER_TEXTS[$index % count(self::EARLIER_TEXTS)],
                'created_at' => $eventDate->copy()->addDays(2)->setTime(19, 0),
            ];
        }

        // Cast accounts cannot sign in: one random password, hashed once and never shown.
        $password = Hash::make(Str::random(40));
        DB::table('users')->upsert(
            array_map(fn (array $user) => $user + ['password' => $password], array_values($users)),
            ['email'], ['name', 'updated_at'],
        );
        DB::table('bookings')->upsert(array_values($bookings), ['number'], ['artist_id', 'status', 'event_date', 'kind', 'church_name', 'church_city', 'updated_at']);

        $userIds = User::whereIn('email', array_keys($users))->pluck('id', 'email');
        $bookingIds = Booking::whereIn('number', array_keys($bookings))->pluck('id', 'number');
        DB::table('reviews')->upsert(array_map(fn (string $number) => [
            'booking_id' => $bookingIds[$number],
            'artist_id' => $abigail->id,
            'booker_id' => $userIds[$reviews[$number]['email']],
            'stars' => $reviews[$number]['stars'],
            'text' => $reviews[$number]['text'],
            'created_at' => $reviews[$number]['created_at'],
        ], array_keys($reviews)), ['booking_id'], ['artist_id', 'booker_id', 'stars', 'text', 'created_at']);
    }

    /**
     * @param  list<Style>  $styles
     */
    private function artist(
        string $slug, string $name, string $ticket, ActType $act, array $styles, string $base,
        int $maxDriveKm, int $fromDollars, ?float $rating, int $reviews, string $published,
        ?Coordinates $at = null,
    ): void {
        $user = $this->castUser($slug, $name);
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
            'approved_at' => Carbon::parse(self::APPROVED[$slug] ?? $published.' 09:00:00', 'America/Toronto')->utc(),
        ]);
        SlugHistory::updateOrCreate(['slug' => $slug], ['artist_id' => $artist->id, 'retired_at' => null]);

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

    /**
     * The admin verification queue (pages/admin-checks): Elijah's first check and a newer one from
     * Abigail, each with a stand-in document on the documents disk under a fixed name, so running the
     * seeder again rewrites the same two objects. A seeded check that was verified since (the e2e
     * suite verifies Elijah's) goes back to waiting, so the queue reads as the mocks show it after
     * every run.
     */
    private function pendingChecks(): void
    {
        $vault = app(DocumentVault::class);
        $pending = [
            ['elijah-park', '2026-09-25', '2026-10-07 16:10:00'],
            ['abigail-mensah', '2026-10-05', '2026-10-09 09:52:00'],
        ];
        foreach ($pending as [$slug, $issuedOn, $uploadedAt]) {
            $artist = Artist::where('slug', $slug)->firstOrFail();
            $check = VulnerableSectorCheck::firstOrNew(['user_id' => $artist->user_id, 'issued_on' => $issuedOn]);
            $stored = $vault->store("%PDF-1.4\n% Stand-in Vulnerable Sector Check for {$artist->display_name}\n%%EOF\n", md5("vsc-{$slug}"));
            $check->forceFill([
                'status' => VscStatus::Pending,
                'verified_at' => null,
                'verified_by' => null,
                'expires_on' => null,
                'storage_key' => $stored['key'],
                'wrapped_data_key' => $stored['wrappedDataKey'],
                'mime_type' => 'application/pdf',
                'size_bytes' => 64,
                'created_at' => Carbon::parse($uploadedAt, 'America/Toronto'),
                'updated_at' => Carbon::parse($uploadedAt, 'America/Toronto'),
            ])->save();
        }
    }
}
