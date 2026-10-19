import { createHash, randomBytes } from 'node:crypto';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { config } from '@config/zamaro';
import type { Database, Transaction } from '@/server/db/client';
import {
  applicationReferences,
  artistApplications,
  artistPhotos,
  artistRatings,
  artists,
  artistStyles,
  artistVideos,
  availabilityOverrides,
  availabilityRules,
  bookings,
  bookingTransitions,
  churches,
  consentRecords,
  reviewReplies,
  reviews,
  roles,
  roleUser,
  savedArtists,
  setlistSongs,
  slugHistories,
  users,
  vulnerableSectorChecks,
  type PhotoRendition,
} from '@/server/db/schema';
import {
  ActType,
  ApplicationStatus,
  ArtistStatus,
  BookingStatus,
  ConsentKind,
  ConsentSource,
  GatheringKind,
  MusicalKey,
  OverrideState,
  Pronoun,
  Role,
  Style,
  VideoStatus,
  VscStatus,
} from '@/server/enums';
import { anchor } from '@/server/integrations/routing/cast-routes';
import { grantRoles } from '@/server/services/accounts/roles';
import { storeDocument } from '@/server/services/artist-onboarding/document-vault';
import { Coordinates } from '@/server/services/discovery/coordinates';
import { recalculateArtistRating } from '@/server/services/reviews/recalculate-artist-rating';
import { now, torontoTime, ZONE } from '@/server/support/clock';
import { encryptField } from '@/server/support/encryption/field-cipher';
import { hashPassword } from '@/server/support/passwords';
import { slug as slugify } from '@/server/support/strings';
import { SAMPLE_CAPTIONS, SAMPLE_STREAM } from './media';

/**
 * The cast from docs/mocks/README.md. Today is Fri 9 Oct 2026; the reference search is
 * Sat 14 Nov 2026 · Burlington · Worship night · 120 km. Every row is upserted on its natural key,
 * so running the seeder again changes nothing.
 */

type ArtistRow = [
  name: string,
  ticket: string,
  act: ActType,
  styles: Style[],
  base: string,
  maxDriveKm: number,
  fromDollars: number,
  rating: number | null,
  reviews: number,
  published: string,
];

const ARTISTS: Record<string, ArtistRow> = {
  'abigail-mensah': [
    'Abigail Mensah',
    'ACT-0027',
    ActType.Solo,
    [Style.SoloVocalist, Style.Hymns],
    'Brampton',
    120,
    650,
    4.9,
    38,
    '2025-03-10',
  ],
  'marcus-bell-trio': [
    'Marcus Bell Trio',
    'ACT-0012',
    ActType.Band,
    [Style.Band, Style.Acoustic, Style.Hymns],
    'Hamilton',
    120,
    950,
    4.6,
    17,
    '2024-09-02',
  ],
  'hosanna-collective': [
    'Hosanna Collective',
    'ACT-0015',
    ActType.Band,
    [Style.Band, Style.Hymns],
    'Mississauga',
    120,
    1800,
    4.8,
    21,
    '2024-11-18',
  ],
  'luz-viva': [
    'Luz Viva',
    'ACT-0019',
    ActType.Band,
    [Style.Band, Style.Acoustic, Style.Spanish],
    'North York',
    120,
    900,
    5.0,
    6,
    '2026-02-23',
  ],
  'elijah-park': [
    'Elijah Park',
    'ACT-0031',
    ActType.Solo,
    [Style.SoloVocalist, Style.Acoustic],
    'Markham',
    120,
    350,
    4.7,
    9,
    '2025-06-30',
  ],
  'grace-tabernacle-mass-choir': [
    'Grace Tabernacle Mass Choir',
    'ACT-0008',
    ActType.Choir,
    [Style.GospelChoir],
    'Scarborough',
    120,
    2400,
    4.8,
    26,
    '2024-05-13',
  ],
  'daniel-and-ruth-okonkwo': [
    'Daniel & Ruth Okonkwo',
    'ACT-0022',
    ActType.Duo,
    [Style.Acoustic, Style.Hymns],
    'Ajax',
    120,
    700,
    4.9,
    14,
    '2025-01-20',
  ],
  // Drives up to 40 km; Riverside in Burlington is 48 km away, so she is not in Naomi's lineup.
  'miriam-haile': [
    'Miriam Haile',
    'ACT-0154',
    ActType.Solo,
    [Style.SoloVocalist],
    'Etobicoke',
    40,
    300,
    null,
    0,
    '2026-10-05',
  ],
};

/** number => [artist, status, date, kind, church, city, confirmed at (null if never confirmed)]. */
const BOOKINGS: Record<
  string,
  [string, BookingStatus, string, GatheringKind, string, string, string | null]
> = {
  'ZAM-0101': [
    'abigail-mensah',
    BookingStatus.Confirmed,
    '2026-10-18',
    GatheringKind.SundayService,
    'Living Waters Fellowship',
    'Brampton',
    '2026-09-08 14:00',
  ],
  'ZAM-0104': [
    'abigail-mensah',
    BookingStatus.Confirmed,
    '2026-11-01',
    GatheringKind.SundayService,
    'Harvest Point Church',
    'Milton',
    '2026-09-15 11:20',
  ],
  'ZAM-0108': [
    'abigail-mensah',
    BookingStatus.Confirmed,
    '2026-11-15',
    GatheringKind.SundayService,
    'Lakeshore Alliance Church',
    'Oakville',
    '2026-09-22 16:05',
  ],
  'ZAM-0110': [
    'abigail-mensah',
    BookingStatus.Confirmed,
    '2026-11-21',
    GatheringKind.WorshipNight,
    'Kingdom Life Centre',
    'Mississauga',
    '2026-09-29 10:40',
  ],
  'ZAM-0116': [
    'abigail-mensah',
    BookingStatus.Confirmed,
    '2026-12-13',
    GatheringKind.SundayService,
    'Living Waters Fellowship',
    'Brampton',
    '2026-10-01 13:15',
  ],
  'ZAM-0118': [
    'abigail-mensah',
    BookingStatus.Confirmed,
    '2026-12-20',
    GatheringKind.SundayService,
    'Lakeshore Alliance Church',
    'Oakville',
    '2026-10-06 09:30',
  ],
  'ZAM-0114': [
    'abigail-mensah',
    BookingStatus.Requested,
    '2026-11-14',
    GatheringKind.WorshipNight,
    'Riverside Community Church',
    'Burlington',
    null,
  ],
  'ZAM-0120': [
    'abigail-mensah',
    BookingStatus.Requested,
    '2026-11-22',
    GatheringKind.SundayService,
    'St. Brendan’s Anglican',
    'Oshawa',
    null,
  ],
  'ZAM-0121': [
    'abigail-mensah',
    BookingStatus.Requested,
    '2026-12-05',
    GatheringKind.ConferenceOrRetreat,
    'Kingdom Life Centre',
    'Mississauga',
    null,
  ],
  // Completed engagements behind Abigail's profile reviews (confirmed before this season).
  'ZAM-0052': [
    'abigail-mensah',
    BookingStatus.Completed,
    '2026-05-10',
    GatheringKind.SundayService,
    'Living Waters Fellowship',
    'Brampton',
    '2026-04-08 10:00',
  ],
  'ZAM-0061': [
    'abigail-mensah',
    BookingStatus.Completed,
    '2026-06-14',
    GatheringKind.SundayService,
    'Riverside Community Church',
    'Burlington',
    '2026-05-20 10:00',
  ],
  'ZAM-0078': [
    'abigail-mensah',
    BookingStatus.Completed,
    '2026-08-16',
    GatheringKind.SundayService,
    'Harvest Point Church',
    'Milton',
    '2026-07-10 10:00',
  ],
  'ZAM-0089': [
    'abigail-mensah',
    BookingStatus.Completed,
    '2026-09-13',
    GatheringKind.SundayService,
    'St. Brendan’s Anglican',
    'Oshawa',
    '2026-08-12 10:00',
  ],
  'ZAM-0097': [
    'marcus-bell-trio',
    BookingStatus.Confirmed,
    '2026-10-25',
    GatheringKind.SundayService,
    'Riverside Community Church',
    'Burlington',
    '2026-09-18 15:00',
  ],
};

/** booking number => [reviewer, account, stars, written at, text] (docs/mocks/pages/artist). */
const REVIEWS: Record<string, [string, string, number, string, string]> = {
  'ZAM-0089': [
    'Rev. Janet Clarke',
    'janet-clarke',
    5,
    '2026-09-15 19:00',
    'She had the whole congregation singing in three-part harmony by the last verse.',
  ],
  'ZAM-0078': [
    'Tomi Oduya',
    'tomi-oduya',
    5,
    '2026-08-18 20:00',
    'She rehearsed with our volunteer band on Saturday and made them sound like pros on Sunday.',
  ],
  'ZAM-0061': [
    'Naomi Fraser',
    'naomi-fraser',
    5,
    '2026-06-16 18:00',
    'Our seniors asked for hymns and our youth asked for Jireh. She gave both, and somehow it felt like one service.',
  ],
  'ZAM-0052': [
    'Pastor Femi Adebayo',
    'femi-adebayo',
    4,
    '2026-05-12 17:00',
    'Wonderful voice and a real pastor’s heart. Gracious about our tiny sound desk.',
  ],
};

/** The cast who can sign in (M2 plan D28): account => their own address. */
const SIGN_IN: Record<string, string> = {
  'naomi-fraser': 'naomi.fraser@riversidecc.ca',
  'abigail-mensah': 'abigail@abigailmensah.ca',
  'tomi-oduya': 'tomi.oduya@harvestpointchurch.ca',
  'miriam-haile': 'miriam@miriamhaile.ca',
};

/** Artists whose account address the admin mocks show (pages/admin-artist). */
const MOCK_EMAILS: Record<string, string> = { 'marcus-bell-trio': 'marcus@marcusbelltrio.ca' };

/** slug => when the application was approved, where the mocks say; else the publish date. */
const APPROVED: Record<string, string> = { 'marcus-bell-trio': '2026-03-02 09:00:00' };

/**
 * Priya Nair, the Zamaro team's administrator (docs/mocks/pages/admin-*). She exists only where the
 * cast can sign in, with two-step sign-in on and this key, so the admin e2e specs compute her codes.
 */
export const PRIYA_EMAIL = 'priya@zamaro.ca';
export const PRIYA_TOTP_SECRET = 'ZAMAROADMINPRIYANAIRTOTPKEY23456';

/** booking number => [replied at, text]: Abigail's replies (docs/mocks/pages/artist-reviews). */
const REPLIES: Record<string, [string, string]> = {
  'ZAM-0078': [
    '2026-10-08 11:20',
    'Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov.',
  ],
  'ZAM-0061': ['2026-06-16 21:00', 'Riverside, you sang the roof off. Thank you for having me.'],
};

/**
 * [reviewer, church, city]: the other 34 churches behind Abigail's 4.9 from 38 churches. Every
 * seventh gives 4 stars and the rest 5, so the 38 reviews sum to 185 stars, a mean of 4.87 (L2-060).
 */
const EARLIER_REVIEWERS: [string, string, string][] = [
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
const EARLIER_TEXTS = [
  'Our whole congregation is still humming the songs she led.',
  'She arrived early, rehearsed with our team and led with real humility.',
  'Beautiful voice, clear communication before the day, and right on time.',
  'She chose songs our older members knew and taught us two new ones.',
  'A worship night our youth keep asking us to repeat.',
  'She prayed with our team before the service. It set the tone for everything.',
];

type Song = [title: string, writer: string, key: MusicalKey];
type Profile = [Pronoun, string, string | null, string, string[], Song[]];

/** slug => [pronoun, headline, About heading, bio, languages, setlist] (docs/mocks/pages/artist, edit-profile). */
const PROFILES: Record<string, Profile> = {
  'abigail-mensah': [
    Pronoun.She,
    'Gospel & contemporary vocalist',
    'Raised in the choir loft',
    'I grew up in my mother’s church in Brampton, learning harmonies from aunties who never needed a microphone. I’ve led worship at New Covenant Chapel for nine years.\n\nI lead in English and Twi, bring my own tracks if you don’t have a band, and I’m happy to rehearse with your volunteers. My aim is a congregation that sings.',
    ['en', 'tw'],
    [
      ['Way Maker', 'Sinach', MusicalKey.E],
      ['Goodness of God', 'Bethel Music', MusicalKey.A],
      ['Great Is Thy Faithfulness', 'Thomas Chisholm, 1923', MusicalKey.D],
      ['Jireh', 'Elevation & Maverick City', MusicalKey.BFlat],
      ['Blessed Assurance', 'Fanny Crosby', MusicalKey.D],
      ['Build My Life', 'Pat Barrett', MusicalKey.G],
      ['Oceans (Where Feet May Fail)', 'Hillsong United', MusicalKey.D],
      ['Twi praise medley', 'Traditional Ghanaian', MusicalKey.F],
    ],
  ],
  'miriam-haile': [
    Pronoun.She,
    'Solo vocalist & pianist',
    'Piano first, then the song',
    'I learned piano before I ever sang in public, and I still lead from the keys.\n\nI’m new to Zamaro and glad to help small congregations find their voice.',
    ['en', 'am'],
    [
      ['Goodness of God', 'Bethel Music', MusicalKey.A],
      ['It Is Well With My Soul', 'Horatio Spafford, 1873', MusicalKey.C],
      ['Abide With Me', 'Henry F. Lyte, 1847', MusicalKey.EFlat],
      ['Firm Foundation', 'Cody Carnes', MusicalKey.B],
    ],
  ],
  'marcus-bell-trio': [
    Pronoun.They,
    'Piano, upright bass and drums',
    null,
    'Three friends from Hamilton who play hymns the way a jazz trio would, and still leave room for the congregation.',
    ['en'],
    [
      ['Great Is Thy Faithfulness', 'Thomas Chisholm, 1923', MusicalKey.D],
      ['Goodness of God', 'Bethel Music', MusicalKey.A],
    ],
  ],
  'hosanna-collective': [
    Pronoun.They,
    'Contemporary worship band',
    null,
    'A seven-piece band from Mississauga that brings its own sound and lights.',
    ['en'],
    [
      ['Build My Life', 'Pat Barrett', MusicalKey.G],
      ['Way Maker', 'Sinach', MusicalKey.E],
    ],
  ],
  'luz-viva': [
    Pronoun.They,
    'Bilingual worship band',
    null,
    'We lead in Spanish and English, for congregations that pray in both.',
    ['en', 'es'],
    [
      ['Cuán Grande es Él', 'Carl Boberg', MusicalKey.BFlat],
      ['Way Maker', 'Sinach', MusicalKey.E],
    ],
  ],
  'elijah-park': [
    Pronoun.He,
    'Acoustic worship leader',
    null,
    'One voice and one guitar, for gatherings that want to hear every word.',
    ['en', 'ko'],
    [
      ['Firm Foundation', 'Cody Carnes', MusicalKey.B],
      ['It Is Well With My Soul', 'Horatio Spafford, 1873', MusicalKey.C],
    ],
  ],
  'grace-tabernacle-mass-choir': [
    Pronoun.They,
    'Gospel mass choir',
    null,
    'Forty voices from Scarborough for the nights a congregation wants to be carried.',
    ['en'],
    [
      ['Total Praise', 'Richard Smallwood', MusicalKey.AFlat],
      ['Oh Happy Day', 'Edwin Hawkins', MusicalKey.G],
    ],
  ],
  'daniel-and-ruth-okonkwo': [
    Pronoun.They,
    'Husband-and-wife worship duo',
    null,
    'Two voices in harmony, with guitar and keys, from Ajax.',
    ['en'],
    [
      ['Blessed Assurance', 'Fanny Crosby', MusicalKey.D],
      ['Goodness of God', 'Bethel Music', MusicalKey.A],
    ],
  ],
};

/** slug => alt text per photo, in order (docs/mocks/pages/artist). The media seeder copies the files. */
const PHOTOS: Record<string, string[]> = {
  'abigail-mensah': [
    'Abigail at the microphone during a Sunday service',
    'Abigail rehearsing with a church volunteer band',
    'Portrait of Abigail smiling in a kente scarf',
    'Abigail leading a youth night from the floor, not the stage',
  ],
  'miriam-haile': [
    'Miriam at the piano during a Sunday evening service',
    'Portrait of Miriam in a white netela shawl',
  ],
};

/** slug => [title, seconds, status, captioned] in order. Every live video plays the one sample stream. */
const VIDEOS: Record<string, [string, number, VideoStatus, boolean][]> = {
  'abigail-mensah': [
    ['Way Maker — live at Bethel Pentecostal, Hamilton', 372, VideoStatus.Live, true],
    ['Great Is Thy Faithfulness — acoustic', 280, VideoStatus.Live, false],
    ['Twi praise medley — Harvest Sunday 2025', 485, VideoStatus.Live, true],
    ['Goodness of God — women’s retreat, Muskoka', 330, VideoStatus.Live, true],
    ['Jireh — live at Living Waters, Brampton', 462, VideoStatus.Processing, false],
  ],
};

/** Seeded photos are 4:3; renditions keep the ratio at each width (L2-051). */
const PHOTO_WIDTHS = [400, 800, 1200, 1600];

const SUPPORTING_CAST = [
  'Kempenfelt Worship Collective',
  'Allandale Gospel Singers',
  'Simcoe Street Praise Band',
  'Minets Point Trio',
  'Painswick Hymn Choir',
  'Georgian Voices',
  'Shanty Bay Strings',
  'Heritage Park Praise',
  'Bayfield Worship Band',
  'Holly Choir of Barrie',
  'Little Lake Acoustic',
  'Ardagh Bluffs Ensemble',
  'Sunnidale Singers',
  'Innisfil Beach Worship',
  'Oro Valley Voices',
  'Midhurst Praise Collective',
  'Springwater Hymn Duo',
  'Wasaga Light Worship',
  'Lefroy Gospel Choir',
  'Stroud Harmony',
  'Cundles Road Band',
  'Grove Street Worship',
  'Mapleview Praise',
  'East Bayfield Acoustic',
  'Letitia Heights Choir',
  'Tollendale Worship Duo',
  'Queens Park Singers',
  'Codrington Praise Band',
  'Victoria Village Voices',
  'Lampman Lane Worship',
];

/** date => her private note; "Studio" is the recording block on the availability mock. */
const ABIGAIL_UNAVAILABLE: Record<string, string | null> = {
  '2026-11-26': 'Studio',
  '2026-11-27': 'Studio',
  '2026-12-24': null,
  '2026-12-25': null,
  '2026-12-26': null,
  '2026-12-31': null,
};

/** retired slug => [artist, retired at]: old addresses that answer 301 (L2-021.3, L2-055.3). */
const RETIRED_SLUGS: Record<string, [string, string]> = {
  'abigail-sings': ['abigail-mensah', '2026-03-02 12:00:00'],
};

type Tx = Transaction | Database;

export async function seedCast(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    const seeder = new CastSeeder(tx, await hashPassword(randomBytes(30).toString('base64')));
    await seeder.run();
  });
}

class CastSeeder {
  constructor(
    private readonly tx: Tx,
    /** Cast accounts cannot sign in: one random password, hashed once and never shown. */
    private readonly randomPasswordHash: string,
  ) {}

  async run(): Promise<void> {
    for (const [slug, row] of Object.entries(ARTISTS)) {
      await this.artist(slug, ...row);
    }
    await this.abigailsCalendar();
    await this.bookings();
    await this.reviews();
    await this.supportingCast();
    await this.christmasChoirs();
    await this.suspendedVocalist();
    await this.retiredSlugs();
    await this.profiles();
    await this.media();
    await this.accounts();
    await this.administrators();
    await this.pendingChecks();
    await this.pendingApplications();
    await this.consents();
    await this.churches();
    await this.savedArtists();
  }

  /**
   * Who may do what: every church person is a Booker and every artist an Artist. Naomi, Abigail
   * and Tomi have verified addresses and, outside production, sign in with ZAMARO_CAST_PASSWORD.
   */
  private async accounts(): Promise<void> {
    const roleIds = new Map(
      (await this.tx.select().from(roles)).map((role) => [role.name, role.id]),
    );
    const artistUserIds = new Set(
      (await this.tx.select({ userId: artists.userId }).from(artists)).map((a) => a.userId),
    );
    const people = await this.tx
      .select({ id: users.id })
      .from(users)
      .where(ne(users.email, PRIYA_EMAIL));
    const bookerRole = roleIds.get(Role.Booker);
    const artistRole = roleIds.get(Role.Artist);
    if (bookerRole === undefined || artistRole === undefined)
      throw new Error('The roles are not seeded.');
    await this.tx
      .insert(roleUser)
      .values(
        people.map(({ id }) => ({
          userId: id,
          roleId: artistUserIds.has(id) ? artistRole : bookerRole,
        })),
      )
      .onConflictDoNothing();

    const password = config().castPassword;
    for (const email of Object.values(SIGN_IN)) {
      await this.tx
        .update(users)
        .set({
          emailVerifiedAt: torontoTime('2026-09-01 12:00:00'),
          password: password === undefined ? this.randomPasswordHash : await hashPassword(password),
        })
        .where(eq(users.email, email));
    }
  }

  /** Priya Nair: an Administrator and nothing else, with two-step sign-in on (L2-066.2). */
  private async administrators(): Promise<void> {
    const password = config().castPassword;
    if (password === undefined) return;
    const values = {
      name: 'Priya Nair',
      password: await hashPassword(password),
      emailVerifiedAt: torontoTime('2026-09-01 12:00:00'),
      mfaEnabled: true,
      twoFactorSecret: encryptField(PRIYA_TOTP_SECRET),
      twoFactorConfirmedAt: torontoTime('2026-09-01 12:05:00'),
    };
    const [priya] = await this.tx
      .insert(users)
      .values({ email: PRIYA_EMAIL, ...values })
      .onConflictDoUpdate({ target: users.email, set: values })
      .returning({ id: users.id });
    if (priya !== undefined) await grantRoles(this.tx, priya.id, [Role.Administrator]);
  }

  /**
   * What the cast agreed to (L2-080): Naomi and Abigail accepted the October terms and privacy policy
   * and said no to marketing email; Tomi last accepted the March terms, so the terms gate stops him.
   * Written once per person, as records are never changed.
   */
  private async consents(): Promise<void> {
    const consents: Record<string, [string, [ConsentKind, string | null, boolean][]]> = {
      'naomi.fraser@riversidecc.ca': [
        '2026-10-08 09:30:00',
        [
          [ConsentKind.Terms, '2026-10', true],
          [ConsentKind.PrivacyPolicy, '2026-10', true],
          [ConsentKind.MarketingEmail, null, false],
        ],
      ],
      'abigail@abigailmensah.ca': [
        '2026-10-08 12:00:00',
        [
          [ConsentKind.Terms, '2026-10', true],
          [ConsentKind.PrivacyPolicy, '2026-10', true],
          [ConsentKind.MarketingEmail, null, false],
        ],
      ],
      'miriam@miriamhaile.ca': [
        '2026-10-05 18:00:00',
        [
          [ConsentKind.Terms, '2026-10', true],
          [ConsentKind.PrivacyPolicy, '2026-10', true],
          [ConsentKind.MarketingEmail, null, false],
        ],
      ],
      'tomi.oduya@harvestpointchurch.ca': [
        '2026-03-04 19:15:00',
        [
          [ConsentKind.Terms, '2026-03', true],
          [ConsentKind.PrivacyPolicy, '2026-03', true],
          [ConsentKind.MarketingEmail, null, false],
        ],
      ],
      // Priya, on the Zamaro team, accepted the October terms the day they took effect.
      [PRIYA_EMAIL]: [
        '2026-10-08 08:00:00',
        [
          [ConsentKind.Terms, '2026-10', true],
          [ConsentKind.PrivacyPolicy, '2026-10', true],
          [ConsentKind.MarketingEmail, null, false],
        ],
      ],
    };
    for (const [email, [at, items]] of Object.entries(consents)) {
      const userId = await this.userId(email);
      const [existing] = await this.tx
        .select({ id: consentRecords.id })
        .from(consentRecords)
        .where(eq(consentRecords.userId, userId))
        .limit(1);
      if (existing !== undefined) continue;
      await this.tx.insert(consentRecords).values(
        items.map(([kind, documentVersion, granted]) => ({
          userId,
          kind,
          documentVersion,
          granted,
          recordedAt: torontoTime(at),
          source: ConsentSource.Registration,
        })),
      );
    }
  }

  /** The churches of the bookers who sign in, and Abigail's private contact phone (L2-025.4), encrypted. */
  private async churches(): Promise<void> {
    const list = [
      [
        'naomi.fraser@riversidecc.ca',
        {
          name: 'Riverside Community Church',
          streetAddress: '2150 Lakeshore Road',
          city: 'Burlington',
          postalCode: 'L7R 1A3',
          phone: '+19055550123',
          denomination: 'Non-denominational' as string | null,
          typicalAttendance: 350,
        },
        'Burlington',
      ],
      [
        'tomi.oduya@harvestpointchurch.ca',
        {
          name: 'Harvest Point Church',
          streetAddress: '8150 Main Street East',
          city: 'Milton',
          postalCode: 'L9T 1A1',
          phone: '+19055550177',
          denomination: null,
          typicalAttendance: 220,
        },
        'Milton',
      ],
    ] as const;
    for (const [email, church, town] of list) {
      const point = anchor(town);
      const values = {
        ...church,
        phone: encryptField(church.phone),
        province: 'ON',
        latitude: point.latitude,
        longitude: point.longitude,
      };
      await this.tx
        .insert(churches)
        .values({ bookerId: await this.userId(email), ...values })
        .onConflictDoUpdate({
          target: churches.bookerId,
          set: { ...values, updatedAt: now().toJSDate() },
        });
    }
    await this.tx
      .update(artists)
      .set({ contactPhone: encryptField('+19055550148') })
      .where(eq(artists.slug, 'abigail-mensah'));
  }

  /** Naomi's saved artists, newest first on the list: Abigail, Hosanna Collective and Luz Viva. */
  private async savedArtists(): Promise<void> {
    const naomi = await this.userId('naomi.fraser@riversidecc.ca');
    const saved: Record<string, string> = {
      'abigail-mensah': '2026-10-07 20:14:00',
      'hosanna-collective': '2026-09-27 15:40:00',
      'luz-viva': '2026-09-12 11:05:00',
    };
    for (const [slug, at] of Object.entries(saved)) {
      await this.tx
        .insert(savedArtists)
        .values({ userId: naomi, artistId: await this.artistId(slug), createdAt: torontoTime(at) })
        .onConflictDoNothing();
    }
    await this.tx
      .update(users)
      .set({ firstSavedAt: torontoTime('2026-09-12 11:05:00') })
      .where(eq(users.id, naomi));
  }

  /**
   * A cast member's account, found by their own address or the cast one and moved to their own,
   * so the seeder can run again on a database seeded before they could sign in.
   */
  private async castUser(account: string, name: string): Promise<number> {
    const cast = `${account}@cast.zamaro.test`;
    const email = SIGN_IN[account] ?? MOCK_EMAILS[account] ?? cast;
    const candidates = await this.tx
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.email, [...new Set([email, cast])]));
    const found = candidates.find((user) => user.email === email) ?? candidates[0];
    if (found !== undefined) {
      await this.tx
        .update(users)
        .set({ email, name, updatedAt: now().toJSDate() })
        .where(eq(users.id, found.id));
      return found.id;
    }
    const [created] = await this.tx
      .insert(users)
      .values({ email, name, password: this.randomPasswordHash })
      .returning({ id: users.id });
    if (created === undefined) throw new Error(`${name} could not be created.`);
    return created.id;
  }

  /** Selah Brooks, a solo vocalist suspended from Zamaro, for the not-found page (L2-021.2). */
  private async suspendedVocalist(): Promise<void> {
    await this.artist(
      'selah-brooks',
      'Selah Brooks',
      'ACT-0044',
      ActType.Solo,
      [Style.SoloVocalist, Style.Hymns],
      'Mississauga',
      120,
      500,
      4.4,
      5,
      '2025-04-14',
    );
    await this.tx
      .update(artists)
      .set({ status: ArtistStatus.Suspended })
      .where(eq(artists.slug, 'selah-brooks'));
  }

  private async retiredSlugs(): Promise<void> {
    for (const [slug, [artist, retiredAt]] of Object.entries(RETIRED_SLUGS)) {
      const values = { artistId: await this.artistId(artist), retiredAt: torontoTime(retiredAt) };
      await this.tx
        .insert(slugHistories)
        .values({ slug, ...values })
        .onConflictDoUpdate({
          target: slugHistories.slug,
          set: { ...values, updatedAt: now().toJSDate() },
        });
    }
  }

  /** Rows only; the keys point at files the media seeder copies to the media disk. */
  private async media(): Promise<void> {
    for (const [slug, alts] of Object.entries(PHOTOS)) {
      const artistId = await this.artistId(slug);
      for (const [index, altText] of alts.entries()) {
        const position = index + 1;
        const renditions: PhotoRendition[] = [];
        for (const format of ['avif', 'webp'] as const) {
          for (const width of PHOTO_WIDTHS) {
            renditions.push({
              width,
              format,
              key: `artists/${slug}/photos/${String(position)}-${String(width)}.${format}`,
            });
          }
        }
        const values = { altText, renditions, width: 1600, height: 1200 };
        const [existing] = await this.tx
          .select({ id: artistPhotos.id })
          .from(artistPhotos)
          .where(and(eq(artistPhotos.artistId, artistId), eq(artistPhotos.position, position)));
        if (existing === undefined) {
          await this.tx.insert(artistPhotos).values({ artistId, position, ...values });
        } else {
          await this.tx
            .update(artistPhotos)
            .set({ ...values, updatedAt: now().toJSDate() })
            .where(eq(artistPhotos.id, existing.id));
        }
      }
    }

    for (const [slug, videos] of Object.entries(VIDEOS)) {
      const artistId = await this.artistId(slug);
      for (const [index, [title, seconds, status, captioned]] of videos.entries()) {
        const position = index + 1;
        const live = status === VideoStatus.Live;
        const values = {
          title,
          status,
          durationSeconds: seconds,
          manifestKey: live ? SAMPLE_STREAM : null,
          captionsKey: live && captioned ? SAMPLE_CAPTIONS : null,
          posterKey: live ? `artists/${slug}/videos/${String(position)}-poster-800.webp` : null,
        };
        const [existing] = await this.tx
          .select({ id: artistVideos.id })
          .from(artistVideos)
          .where(and(eq(artistVideos.artistId, artistId), eq(artistVideos.position, position)));
        if (existing === undefined) {
          await this.tx.insert(artistVideos).values({ artistId, position, ...values });
        } else {
          await this.tx
            .update(artistVideos)
            .set({ ...values, updatedAt: now().toJSDate() })
            .where(eq(artistVideos.id, existing.id));
        }
      }
    }
  }

  private async profiles(): Promise<void> {
    for (const [slug, [pronoun, headline, aboutHeading, bio, languages, songs]] of Object.entries(
      PROFILES,
    )) {
      const artistId = await this.artistId(slug);
      await this.tx
        .update(artists)
        .set({ pronoun, headline, aboutHeading, bio, languages, updatedAt: now().toJSDate() })
        .where(eq(artists.id, artistId));
      for (const [index, [title, writer, key]] of songs.entries()) {
        const position = index + 1;
        const [existing] = await this.tx
          .select({ id: setlistSongs.id })
          .from(setlistSongs)
          .where(and(eq(setlistSongs.artistId, artistId), eq(setlistSongs.position, position)));
        if (existing === undefined) {
          await this.tx.insert(setlistSongs).values({ artistId, position, title, writer, key });
        } else {
          await this.tx
            .update(setlistSongs)
            .set({ title, writer, key, updatedAt: now().toJSDate() })
            .where(eq(setlistSongs.id, existing.id));
        }
      }
    }
  }

  /**
   * Gospel choirs for the sold-out state (L2-011). Each is unavailable every weekday and free only
   * on the dates below, so no other search changes.
   */
  private async christmasChoirs(): Promise<void> {
    const choirs: Record<string, [string, string, Coordinates, number, number, number, string[]]> =
      {
        'lakeshore-gospel-voices': [
          'Lakeshore Gospel Voices',
          'ACT-0061',
          new Coordinates(43.4675, -79.6877),
          1500,
          4.7,
          12,
          ['2026-12-20', '2026-12-23', '2026-12-27'],
        ],
        'hamilton-mountain-mass-choir': [
          'Hamilton Mountain Mass Choir',
          'ACT-0062',
          new Coordinates(43.21, -79.86),
          1700,
          4.8,
          15,
          ['2026-12-20', '2026-12-27'],
        ],
        'halton-praise-choir': [
          'Halton Praise Choir',
          'ACT-0063',
          new Coordinates(43.5183, -79.8774),
          1200,
          4.5,
          8,
          ['2026-12-27'],
        ],
        'durham-gospel-choir': [
          'Durham Gospel Choir',
          'ACT-0064',
          anchor('Ajax'),
          1900,
          4.6,
          10,
          ['2026-12-24'],
        ],
      };
    for (const [
      slug,
      [name, ticket, at, fromDollars, rating, reviewCount, freeDates],
    ] of Object.entries(choirs)) {
      await this.artist(
        slug,
        name,
        ticket,
        ActType.Choir,
        [Style.GospelChoir],
        'Burlington',
        120,
        fromDollars,
        rating,
        reviewCount,
        '2025-11-01',
        at,
      );
      const artistId = await this.artistId(slug);
      for (let weekday = 1; weekday <= 7; weekday++) {
        await this.tx
          .insert(availabilityRules)
          .values({ artistId, weekday, unavailable: true })
          .onConflictDoUpdate({
            target: [availabilityRules.artistId, availabilityRules.weekday],
            set: { unavailable: true },
          });
      }
      for (const date of freeDates) {
        await this.tx
          .insert(availabilityOverrides)
          .values({ artistId, date, state: OverrideState.Free })
          .onConflictDoUpdate({
            target: [availabilityOverrides.artistId, availabilityOverrides.date],
            set: { state: OverrideState.Free },
          });
      }
    }
  }

  /**
   * Thirty artists around Barrie, for paging (L2-010): all free on Sat 14 Nov within 40 km of
   * Barrie, and more than 120 km by road from Burlington. Every seventh has no reviews yet.
   */
  private async supportingCast(): Promise<void> {
    const barrie = anchor('Barrie');
    const styles: Style[][] = [
      [Style.Band, Style.Hymns],
      [Style.SoloVocalist, Style.Acoustic],
      [Style.GospelChoir],
      [Style.Acoustic, Style.Spanish],
      [Style.Band],
    ];
    const acts: ActType[] = [ActType.Band, ActType.Solo, ActType.Choir, ActType.Duo, ActType.Band];
    for (const [index, name] of SUPPORTING_CAST.entries()) {
      const reviewed = (index + 1) % 7 !== 0;
      await this.artist(
        slugify(name),
        name,
        `ACT-${String(1001 + index).padStart(4, '0')}`,
        acts[index % 5] ?? ActType.Band,
        styles[index % 5] ?? [Style.Band],
        'Barrie',
        120,
        300 + ((index * 37) % 20) * 100,
        reviewed ? Math.round((4.0 + ((index * 13) % 11) / 10) * 10) / 10 : null,
        reviewed ? 3 + ((index * 7) % 30) : 0,
        '2025-09-01',
        new Coordinates(
          barrie.latitude + (index % 6) * 0.004,
          barrie.longitude + Math.floor(index / 6) * 0.006,
        ),
      );
    }
  }

  private async bookings(): Promise<void> {
    for (const [
      number,
      [slug, status, eventDate, kind, churchName, churchCity, confirmedAt],
    ] of Object.entries(BOOKINGS)) {
      const values = {
        artistId: await this.artistId(slug),
        status,
        eventDate,
        kind,
        churchName,
        churchCity,
      };
      const [booking] = await this.tx
        .insert(bookings)
        .values({ number, ...values })
        .onConflictDoUpdate({
          target: bookings.number,
          set: { ...values, updatedAt: now().toJSDate() },
        })
        .returning({ id: bookings.id });
      if (booking === undefined || confirmedAt === null) continue;
      const transition = {
        fromStatus: BookingStatus.Accepted,
        actorKind: 'booker',
        occurredAt: torontoTime(confirmedAt),
      };
      const [existing] = await this.tx
        .select({ id: bookingTransitions.id })
        .from(bookingTransitions)
        .where(
          and(
            eq(bookingTransitions.bookingId, booking.id),
            eq(bookingTransitions.toStatus, BookingStatus.Confirmed),
          ),
        );
      if (existing === undefined) {
        await this.tx
          .insert(bookingTransitions)
          .values({ bookingId: booking.id, toStatus: BookingStatus.Confirmed, ...transition });
      } else {
        await this.tx
          .update(bookingTransitions)
          .set(transition)
          .where(eq(bookingTransitions.id, existing.id));
      }
    }
  }

  private async reviews(): Promise<void> {
    for (const [number, [reviewer, account, stars, writtenAt, text]] of Object.entries(REVIEWS)) {
      const bookerId = await this.castUser(account, reviewer);
      const [booking] = await this.tx
        .select({ id: bookings.id, artistId: bookings.artistId })
        .from(bookings)
        .where(eq(bookings.number, number));
      if (booking === undefined) throw new Error(`Booking ${number} is not seeded.`);
      const values = {
        artistId: booking.artistId,
        bookerId,
        stars,
        text,
        createdAt: torontoTime(writtenAt),
      };
      await this.tx
        .insert(reviews)
        .values({ bookingId: booking.id, ...values })
        .onConflictDoUpdate({ target: reviews.bookingId, set: values });
    }

    for (const [number, [repliedAt, text]] of Object.entries(REPLIES)) {
      const [review] = await this.tx
        .select({ id: reviews.id, artistId: reviews.artistId })
        .from(reviews)
        .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
        .where(eq(bookings.number, number));
      if (review === undefined) throw new Error(`The review of ${number} is not seeded.`);
      const values = { artistId: review.artistId, text, createdAt: torontoTime(repliedAt) };
      await this.tx
        .insert(reviewReplies)
        .values({ reviewId: review.id, ...values })
        .onConflictDoUpdate({ target: reviewReplies.reviewId, set: values });
    }

    const abigail = await this.artistId('abigail-mensah');
    await this.earlierReviews(abigail);
    // Her summary comes from the reviews, as the worker keeps it; the rest of the cast keeps the
    // seeded summaries in ARTISTS, which have no reviews behind them yet.
    await recalculateArtistRating(this.tx, abigail);
  }

  /**
   * Abigail's older reviews, one per church, each behind a completed Sunday booking: the newest
   * on Tue 5 May 2026, then a week apart. Bulk upserts on the natural keys keep reseeding quick.
   */
  private async earlierReviews(abigail: number): Promise<void> {
    const lastSunday = DateTime.fromISO('2026-05-03', { zone: ZONE });
    const people = EARLIER_REVIEWERS.map(([name, church, city], index) => {
      const eventDate = lastSunday.minus({ weeks: index });
      return {
        name,
        email: `${slugify(name)}@cast.zamaro.test`,
        number: `ZAM-${String(index + 1).padStart(4, '0')}`,
        eventDate: eventDate.toISODate() ?? '',
        church,
        city,
        stars: index % 7 === 6 ? 4 : 5,
        text: EARLIER_TEXTS[index % EARLIER_TEXTS.length] ?? '',
        createdAt: eventDate
          .plus({ days: 2 })
          .set({ hour: 19, minute: 0, second: 0, millisecond: 0 })
          .toJSDate(),
      };
    });

    await this.tx
      .insert(users)
      .values(
        people.map((p) => ({ name: p.name, email: p.email, password: this.randomPasswordHash })),
      )
      .onConflictDoUpdate({
        target: users.email,
        set: { name: sql`excluded.name`, updatedAt: now().toJSDate() },
      });
    await this.tx
      .insert(bookings)
      .values(
        people.map((p) => ({
          number: p.number,
          artistId: abigail,
          status: BookingStatus.Completed,
          eventDate: p.eventDate,
          kind: GatheringKind.SundayService,
          churchName: p.church,
          churchCity: p.city,
        })),
      )
      .onConflictDoUpdate({
        target: bookings.number,
        set: {
          artistId: sql`excluded.artist_id`,
          status: sql`excluded.status`,
          eventDate: sql`excluded.event_date`,
          kind: sql`excluded.kind`,
          churchName: sql`excluded.church_name`,
          churchCity: sql`excluded.church_city`,
          updatedAt: now().toJSDate(),
        },
      });

    const userIds = new Map(
      (
        await this.tx
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(
            inArray(
              users.email,
              people.map((p) => p.email),
            ),
          )
      ).map((u) => [u.email, u.id]),
    );
    const bookingIds = new Map(
      (
        await this.tx
          .select({ id: bookings.id, number: bookings.number })
          .from(bookings)
          .where(
            inArray(
              bookings.number,
              people.map((p) => p.number),
            ),
          )
      ).map((b) => [b.number, b.id]),
    );
    await this.tx
      .insert(reviews)
      .values(
        people.map((p) => {
          const bookingId = bookingIds.get(p.number);
          const bookerId = userIds.get(p.email);
          if (bookingId === undefined || bookerId === undefined)
            throw new Error(`${p.number} is not seeded.`);
          return {
            bookingId,
            artistId: abigail,
            bookerId,
            stars: p.stars,
            text: p.text,
            createdAt: p.createdAt,
          };
        }),
      )
      .onConflictDoUpdate({
        target: reviews.bookingId,
        set: {
          artistId: sql`excluded.artist_id`,
          bookerId: sql`excluded.booker_id`,
          stars: sql`excluded.stars`,
          text: sql`excluded.text`,
          createdAt: sql`excluded.created_at`,
        },
      });
  }

  private async artist(
    slug: string,
    name: string,
    ticketNumber: string,
    act: ActType,
    styles: Style[],
    baseCity: string,
    maxDriveKm: number,
    fromDollars: number,
    rating: number | null,
    reviewCount: number,
    published: string,
    at?: Coordinates,
  ): Promise<void> {
    const userId = await this.castUser(slug, name);
    const base = at ?? anchor(baseCity);
    const values = {
      userId,
      ticketNumber,
      displayName: name,
      actType: act,
      baseCity,
      baseLatitude: base.latitude,
      baseLongitude: base.longitude,
      maxDriveKm,
      fromPriceCents: fromDollars * 100,
      status: ArtistStatus.Approved,
      payoutReady: true,
      publishedAt: torontoTime(`${published} 09:00:00`),
      approvedAt: torontoTime(APPROVED[slug] ?? `${published} 09:00:00`),
    };
    const [artist] = await this.tx
      .insert(artists)
      .values({ slug, ...values })
      .onConflictDoUpdate({ target: artists.slug, set: { ...values, updatedAt: now().toJSDate() } })
      .returning({ id: artists.id });
    if (artist === undefined) throw new Error(`${name} could not be saved.`);
    await this.tx
      .insert(slugHistories)
      .values({ slug, artistId: artist.id, retiredAt: null })
      .onConflictDoUpdate({
        target: slugHistories.slug,
        set: { artistId: artist.id, retiredAt: null, updatedAt: now().toJSDate() },
      });

    await this.tx.delete(artistStyles).where(eq(artistStyles.artistId, artist.id));
    await this.tx
      .insert(artistStyles)
      .values(styles.map((style) => ({ artistId: artist.id, style })));

    await this.tx
      .insert(artistRatings)
      .values({ artistId: artist.id, rating, reviewCount })
      .onConflictDoUpdate({ target: artistRatings.artistId, set: { rating, reviewCount } });
  }

  private async abigailsCalendar(): Promise<void> {
    const abigail = await this.artistId('abigail-mensah');
    await this.tx
      .insert(availabilityRules)
      .values({ artistId: abigail, weekday: 1, unavailable: true })
      .onConflictDoUpdate({
        target: [availabilityRules.artistId, availabilityRules.weekday],
        set: { unavailable: true },
      });
    for (const [date, note] of Object.entries(ABIGAIL_UNAVAILABLE)) {
      await this.tx
        .insert(availabilityOverrides)
        .values({ artistId: abigail, date, state: OverrideState.Unavailable, note })
        .onConflictDoUpdate({
          target: [availabilityOverrides.artistId, availabilityOverrides.date],
          set: { state: OverrideState.Unavailable, note },
        });
    }

    await this.check(await this.artistUserId('abigail-mensah'), '2025-03-03', {
      expiresOn: '2028-03-03',
      status: VscStatus.Verified,
      verifiedAt: torontoTime('2025-03-05 11:00:00'),
    });
    // Daniel & Ruth Okonkwo's check runs out Mon 30 Nov 2026, 52 days from today: inside the
    // renewal window, so the daily run has someone to remind (L2-049.3, M3 S9).
    await this.check(await this.artistUserId('daniel-and-ruth-okonkwo'), '2023-11-30', {
      expiresOn: '2026-11-30',
      status: VscStatus.Verified,
      verifiedAt: torontoTime('2023-12-04 15:00:00'),
    });
  }

  /**
   * The admin verification queue (pages/admin-checks): Elijah's first check and a newer one from
   * Abigail, each with a stand-in document on the documents disk under a fixed name. A seeded check
   * that was verified since goes back to waiting, so the queue reads as the mocks show it.
   */
  private async pendingChecks(): Promise<void> {
    const pending: [string, string, string][] = [
      ['elijah-park', '2026-09-25', '2026-10-07 16:10:00'],
      ['abigail-mensah', '2026-10-05', '2026-10-09 09:52:00'],
    ];
    for (const [slug, issuedOn, uploadedAt] of pending) {
      const [artist] = await this.tx
        .select({ userId: artists.userId, displayName: artists.displayName })
        .from(artists)
        .where(eq(artists.slug, slug));
      if (artist === undefined) throw new Error(`${slug} is not seeded.`);
      const stored = await storeDocument(
        Buffer.from(
          `%PDF-1.4\n% Stand-in Vulnerable Sector Check for ${artist.displayName}\n%%EOF\n`,
        ),
        createHash('md5').update(`vsc-${slug}`).digest('hex'),
      );
      await this.check(artist.userId, issuedOn, {
        status: VscStatus.Pending,
        verifiedAt: null,
        verifiedBy: null,
        expiresOn: null,
        storageKey: stored.key,
        wrappedDataKey: stored.wrappedDataKey,
        mimeType: 'application/pdf',
        sizeBytes: 64,
        createdAt: torontoTime(uploadedAt),
        updatedAt: torontoTime(uploadedAt),
      });
    }
  }

  /**
   * The admin application queue (pages/admin-applications): three Submitted applications, each with
   * two church references. Tobi's A-0219 is the one the review mocks open.
   */
  private async pendingApplications(): Promise<void> {
    const applications = [
      {
        number: 'A-0217',
        key: '6f1c0d52-3a1e-4d1b-9a55-0d7e2d9c1a17',
        name: 'Ebenezer Brass Band',
        email: 'ebenezer.brass@example.com',
        actType: ActType.Band,
        baseCity: 'Oshawa, ON',
        baseLatitude: 43.8971,
        baseLongitude: -78.8658,
        styles: [Style.Band, Style.Hymns],
        bio: 'A brass band of nine players from Oshawa. We play for Sunday services, carol nights and church anniversaries, and we bring our own stands and sound.',
        fromPriceCents: 90000,
        maxDriveKm: 100,
        submittedAt: '2026-10-06 16:20:00',
        references: [
          ['Pastor Grace Adu', 'Oshawa Gospel Chapel', 'grace.adu@oshawagospel.example'],
          ['Daniel Mensah', 'Harvest Fellowship Oshawa', '905 555 0141'],
        ],
      },
      {
        number: 'A-0218',
        key: '0b6f6a41-7c4f-4b0e-8f3a-6e4c5a2d9b18',
        name: 'Kezia & Mark Thompson',
        email: 'kezia.mark@example.com',
        actType: ActType.Duo,
        baseCity: 'Pickering, ON',
        baseLatitude: 43.8384,
        baseLongitude: -79.0868,
        styles: [Style.Acoustic, Style.Hymns],
        bio: 'A husband and wife duo leading worship from guitar and piano. We have served small and mid-sized congregations across Durham Region for eight years.',
        fromPriceCents: 50000,
        maxDriveKm: 80,
        submittedAt: '2026-10-08 21:05:00',
        references: [
          ['Rev. Paul Ncube', 'Pickering Community Church', 'paul.ncube@pickering.example'],
          ['Sarah Whitlock', 'Ajax Alliance Church', '289 555 0166'],
        ],
      },
      {
        number: 'A-0219',
        key: '9d3e8b0a-52c1-4e6f-b7a4-1f2a3c4d5e19',
        name: 'Tobi Adeyemi',
        email: 'tobi@tobiadeyemi.ca',
        actType: ActType.Solo,
        baseCity: 'Scarborough, ON',
        baseLatitude: 43.7731,
        baseLongitude: -79.2578,
        styles: [Style.SoloVocalist, Style.Acoustic, Style.Hymns],
        bio: "I'm a vocalist and keys player from Scarborough, and I've led Sunday worship at Cornerstone Baptist for six years. I lead from the piano, so I can carry a service on my own or slot in with your band. My sets mix the hymns your seniors love with newer songs your youth know, and I'm happy to send charts to your volunteers ahead of time.",
        fromPriceCents: 40000,
        maxDriveKm: 80,
        submittedAt: '2026-10-09 10:42:00',
        references: [
          [
            'Pastor Samuel Osei',
            'Cornerstone Baptist, Scarborough',
            'samuel.osei@cornerstonebaptist.ca',
          ],
          ['Ruth Kim', 'Agincourt Community Church', '647 555 0192'],
        ],
      },
    ];
    for (const application of applications) {
      const { references, key, submittedAt, ...fields } = application;
      const at = torontoTime(submittedAt);
      const values = {
        ...fields,
        idempotencyKey: key,
        status: ApplicationStatus.Submitted,
        submittedAt: at,
        decidedAt: null,
        decidedBy: null,
        rejectionReason: null,
        createdAt: at,
        updatedAt: at,
      };
      const [row] = await this.tx
        .insert(artistApplications)
        .values(values)
        .onConflictDoUpdate({ target: artistApplications.number, set: values })
        .returning({ id: artistApplications.id });
      if (row === undefined) throw new Error(`${fields.number} could not be seeded.`);
      await this.tx
        .delete(applicationReferences)
        .where(eq(applicationReferences.artistApplicationId, row.id));
      if (fields.number === 'A-0219') await this.tobiVideo(row.id, at);
      for (const [name = '', church = '', contact = ''] of references) {
        const isEmail = contact.includes('@');
        await this.tx.insert(applicationReferences).values({
          artistApplicationId: row.id,
          name,
          church,
          phone: isEmail ? null : encryptField(`+1${contact.replace(/\D/g, '')}`),
          email: isEmail ? encryptField(contact) : null,
          createdAt: at,
          updatedAt: at,
        });
      }
    }
  }

  /** The one video Tobi attached to A-0219 (pages/admin-application), Live with its sample stream. */
  private async tobiVideo(applicationId: number, at: Date): Promise<void> {
    const values = {
      artistApplicationId: applicationId,
      position: 1,
      title: 'Way Maker — live at Cornerstone',
      status: VideoStatus.Live,
      durationSeconds: 348,
      manifestKey: SAMPLE_STREAM,
      fileName: 'way-maker-cornerstone.mp4',
      createdAt: at,
      updatedAt: at,
    };
    await this.tx
      .insert(artistVideos)
      .values({ ...values, uploadToken: 'seed-a-0219-way-maker' })
      .onConflictDoUpdate({ target: artistVideos.uploadToken, set: values });
  }

  /** Upserts a check on (user, issued on), which has no unique constraint. */
  private async check(
    userId: number,
    issuedOn: string,
    values: Partial<typeof vulnerableSectorChecks.$inferInsert> & { status: VscStatus },
  ): Promise<void> {
    const [existing] = await this.tx
      .select({ id: vulnerableSectorChecks.id })
      .from(vulnerableSectorChecks)
      .where(
        and(
          eq(vulnerableSectorChecks.userId, userId),
          eq(vulnerableSectorChecks.issuedOn, issuedOn),
        ),
      );
    if (existing === undefined) {
      await this.tx.insert(vulnerableSectorChecks).values({ userId, issuedOn, ...values });
    } else {
      await this.tx
        .update(vulnerableSectorChecks)
        .set(values)
        .where(eq(vulnerableSectorChecks.id, existing.id));
    }
  }

  private async artistId(slug: string): Promise<number> {
    const [artist] = await this.tx
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.slug, slug));
    if (artist === undefined) throw new Error(`${slug} is not seeded.`);
    return artist.id;
  }

  private async artistUserId(slug: string): Promise<number> {
    const [artist] = await this.tx
      .select({ userId: artists.userId })
      .from(artists)
      .where(eq(artists.slug, slug));
    if (artist === undefined) throw new Error(`${slug} is not seeded.`);
    return artist.userId;
  }

  private async userId(email: string): Promise<number> {
    const [user] = await this.tx.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (user === undefined) throw new Error(`${email} is not seeded.`);
    return user.id;
  }
}
