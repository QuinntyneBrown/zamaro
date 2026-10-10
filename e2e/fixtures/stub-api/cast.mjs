// The cast as the backend's CastSeeder writes it (backend/database/seeders/CastSeeder.php), with the
// fake router and geocoder (backend/app/Integrations). The stub API answers from this data, so the
// numbers match what the seeded API returned. Keep it in step with the seeder.

/** The places in docs/mocks/README.md (CastRoutes::ANCHORS). */
export const ANCHORS = {
  "Toronto City Hall": [43.6534, -79.3841],
  Burlington: [43.325, -79.799],
  Hamilton: [43.2557, -79.8711],
  Mississauga: [43.589, -79.6441],
  Brampton: [43.7315, -79.7624],
  Etobicoke: [43.6205, -79.5132],
  "North York": [43.7615, -79.4111],
  Markham: [43.8561, -79.337],
  Scarborough: [43.7764, -79.2318],
  Ajax: [43.8509, -79.0204],
  Oshawa: [43.8971, -78.8658],
  Barrie: [44.3894, -79.6903],
  Kitchener: [43.4516, -80.4925],
  Niagara: [43.0896, -79.0849],
  Ottawa: [45.4215, -75.6972],
};

/** Towns the fake geocoder knows; Toronto resolves to City Hall (CastRoutes::TOWNS). */
const TOWNS = {
  Toronto: "Toronto City Hall",
  Burlington: "Burlington",
  Mississauga: "Mississauga",
  Brampton: "Brampton",
  Hamilton: "Hamilton",
  Markham: "Markham",
  Ajax: "Ajax",
  Oshawa: "Oshawa",
  Barrie: "Barrie",
  Kitchener: "Kitchener",
  Niagara: "Niagara",
  Etobicoke: "Etobicoke",
  "North York": "North York",
  Scarborough: "Scarborough",
  Ottawa: "Ottawa",
};

/** Road kilometres between anchor pairs; symmetric (CastRoutes::ROAD_KM). */
const ROAD_KM = [
  ["Burlington", "Hamilton", 14],
  ["Burlington", "Mississauga", 32],
  ["Burlington", "Brampton", 44],
  ["Burlington", "Etobicoke", 48],
  ["Burlington", "North York", 63],
  ["Burlington", "Markham", 74],
  ["Burlington", "Scarborough", 81],
  ["Burlington", "Ajax", 97],
  ["Toronto City Hall", "Burlington", 55],
  ["Toronto City Hall", "Ottawa", 450],
];

const point = (place) => ({ lat: ANCHORS[place][0], lng: ANCHORS[place][1] });

/** Great-circle distance in kilometres (Coordinates::straightLineKmTo). */
export function straightLineKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const h =
    Math.sin((rad(b.lat) - rad(a.lat)) / 2) ** 2 +
    Math.cos(rad(a.lat)) *
      Math.cos(rad(b.lat)) *
      Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function snap(p) {
  return (
    Object.keys(ANCHORS).find(
      (place) => straightLineKm(p, point(place)) <= 2,
    ) ?? null
  );
}

/** Road distance as the fake router and Distance::fromRoute give it: whole km, minutes to 5. */
export function roadDistance(from, to) {
  const a = snap(from);
  const b = snap(to);
  const known =
    a &&
    b &&
    ROAD_KM.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const km = known ? known[2] : straightLineKm(from, to) * 1.25;
  const metres = Math.round(km * 1000);
  const seconds = Math.round((km / 80) * 3600);
  return {
    km: Math.round(metres / 1000),
    driveMinutes: Math.round(seconds / 60 / 5) * 5,
    approximate: false,
  };
}

/** FakeGeocoder: a known town, ignoring case and a trailing ", ON". */
export function geocode(text) {
  const town = text
    .trim()
    .replace(/(,\s*|\s+)(ON|Ontario)$/i, "")
    .trim()
    .toLowerCase();
  const name = Object.keys(TOWNS).find(
    (candidate) => candidate.toLowerCase() === town,
  );
  if (!name) return null;
  const at = point(TOWNS[name]);
  return { label: `${name}, ON`, city: name, lat: at.lat, lng: at.lng };
}

export const CITY_HALL = point("Toronto City Hall");

const PROFILES = {
  "abigail-mensah": [
    "she",
    "Gospel & contemporary vocalist",
    "Raised in the choir loft",
    "I grew up in my mother’s church in Brampton, learning harmonies from aunties who never needed a microphone. I’ve led worship at New Covenant Chapel for nine years.\n\nI lead in English and Twi, bring my own tracks if you don’t have a band, and I’m happy to rehearse with your volunteers. My aim is a congregation that sings.",
    [
      ["Way Maker", "Sinach", "E"],
      ["Goodness of God", "Bethel Music", "A"],
      ["Great Is Thy Faithfulness", "Thomas Chisholm, 1923", "D"],
      ["Jireh", "Elevation & Maverick City", "B-flat"],
      ["Blessed Assurance", "Fanny Crosby", "D"],
      ["Build My Life", "Pat Barrett", "G"],
      ["Oceans (Where Feet May Fail)", "Hillsong United", "D"],
      ["Twi praise medley", "Traditional Ghanaian", "F"],
    ],
  ],
  "miriam-haile": [
    "she",
    "Solo vocalist & pianist",
    "Piano first, then the song",
    "I learned piano before I ever sang in public, and I still lead from the keys.\n\nI’m new to Zamaro and glad to help small congregations find their voice.",
    [
      ["Goodness of God", "Bethel Music", "A"],
      ["It Is Well With My Soul", "Horatio Spafford, 1873", "C"],
      ["Abide With Me", "Henry F. Lyte, 1847", "E-flat"],
      ["Firm Foundation", "Cody Carnes", "B"],
    ],
  ],
  "marcus-bell-trio": [
    "they",
    "Piano, upright bass and drums",
    null,
    "Three friends from Hamilton who play hymns the way a jazz trio would, and still leave room for the congregation.",
    [
      ["Great Is Thy Faithfulness", "Thomas Chisholm, 1923", "D"],
      ["Goodness of God", "Bethel Music", "A"],
    ],
  ],
  "hosanna-collective": [
    "they",
    "Contemporary worship band",
    null,
    "A seven-piece band from Mississauga that brings its own sound and lights.",
    [
      ["Build My Life", "Pat Barrett", "G"],
      ["Way Maker", "Sinach", "E"],
    ],
  ],
  "luz-viva": [
    "they",
    "Bilingual worship band",
    null,
    "We lead in Spanish and English, for congregations that pray in both.",
    [
      ["Cuán Grande es Él", "Carl Boberg", "B-flat"],
      ["Way Maker", "Sinach", "E"],
    ],
  ],
  "elijah-park": [
    "he",
    "Acoustic worship leader",
    null,
    "One voice and one guitar, for gatherings that want to hear every word.",
    [
      ["Firm Foundation", "Cody Carnes", "B"],
      ["It Is Well With My Soul", "Horatio Spafford, 1873", "C"],
    ],
  ],
  "grace-tabernacle-mass-choir": [
    "they",
    "Gospel mass choir",
    null,
    "Forty voices from Scarborough for the nights a congregation wants to be carried.",
    [
      ["Total Praise", "Richard Smallwood", "A-flat"],
      ["Oh Happy Day", "Edwin Hawkins", "G"],
    ],
  ],
  "daniel-and-ruth-okonkwo": [
    "they",
    "Husband-and-wife worship duo",
    null,
    "Two voices in harmony, with guitar and keys, from Ajax.",
    [
      ["Blessed Assurance", "Fanny Crosby", "D"],
      ["Goodness of God", "Bethel Music", "A"],
    ],
  ],
};

const SUPPORTING_CAST = [
  "Kempenfelt Worship Collective",
  "Allandale Gospel Singers",
  "Simcoe Street Praise Band",
  "Minets Point Trio",
  "Painswick Hymn Choir",
  "Georgian Voices",
  "Shanty Bay Strings",
  "Heritage Park Praise",
  "Bayfield Worship Band",
  "Holly Choir of Barrie",
  "Little Lake Acoustic",
  "Ardagh Bluffs Ensemble",
  "Sunnidale Singers",
  "Innisfil Beach Worship",
  "Oro Valley Voices",
  "Midhurst Praise Collective",
  "Springwater Hymn Duo",
  "Wasaga Light Worship",
  "Lefroy Gospel Choir",
  "Stroud Harmony",
  "Cundles Road Band",
  "Grove Street Worship",
  "Mapleview Praise",
  "East Bayfield Acoustic",
  "Letitia Heights Choir",
  "Tollendale Worship Duo",
  "Queens Park Singers",
  "Codrington Praise Band",
  "Victoria Village Voices",
  "Lampman Lane Worship",
];

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Insertion order gives the ids, as in the seeder's run(). */
function buildArtists() {
  const artists = [];
  const add = (
    slug,
    name,
    ticket,
    actType,
    styles,
    base,
    maxDriveKm,
    fromDollars,
    rating,
    reviews,
    extra = {},
  ) =>
    artists.push({
      id: artists.length + 1,
      slug,
      name,
      ticket,
      actType,
      styles,
      baseCity: base,
      at: extra.at ?? point(base),
      maxDriveKm,
      fromCents: fromDollars * 100,
      rating,
      reviewCount: reviews,
      weeklyUnavailable: extra.weeklyUnavailable ?? [],
      overrides: extra.overrides ?? {},
      confirmedDates: [],
      confirmedThisSeason: 0,
      verifiedCheckUntil: extra.verifiedCheckUntil ?? null,
    });

  add(
    "abigail-mensah",
    "Abigail Mensah",
    "ACT-0027",
    "solo",
    ["solo-vocalist", "hymns"],
    "Brampton",
    120,
    650,
    4.9,
    38,
    {
      weeklyUnavailable: [1],
      overrides: Object.fromEntries(
        [
          "2026-11-26",
          "2026-11-27",
          "2026-12-24",
          "2026-12-25",
          "2026-12-26",
          "2026-12-31",
        ].map((d) => [d, "unavailable"]),
      ),
      verifiedCheckUntil: "2028-03-03",
    },
  );
  add(
    "marcus-bell-trio",
    "Marcus Bell Trio",
    "ACT-0012",
    "band",
    ["band", "acoustic", "hymns"],
    "Hamilton",
    120,
    950,
    4.6,
    17,
  );
  add(
    "hosanna-collective",
    "Hosanna Collective",
    "ACT-0015",
    "band",
    ["band", "hymns"],
    "Mississauga",
    120,
    1800,
    4.8,
    21,
  );
  add(
    "luz-viva",
    "Luz Viva",
    "ACT-0019",
    "band",
    ["band", "acoustic", "spanish"],
    "North York",
    120,
    900,
    5.0,
    6,
  );
  add(
    "elijah-park",
    "Elijah Park",
    "ACT-0031",
    "solo",
    ["solo-vocalist", "acoustic"],
    "Markham",
    120,
    350,
    4.7,
    9,
  );
  add(
    "grace-tabernacle-mass-choir",
    "Grace Tabernacle Mass Choir",
    "ACT-0008",
    "choir",
    ["gospel-choir"],
    "Scarborough",
    120,
    2400,
    4.8,
    26,
  );
  add(
    "daniel-and-ruth-okonkwo",
    "Daniel & Ruth Okonkwo",
    "ACT-0022",
    "duo",
    ["acoustic", "hymns"],
    "Ajax",
    120,
    700,
    4.9,
    14,
  );
  // Drives up to 40 km; Burlington is 48 km away, so she is not in Naomi's lineup.
  add(
    "miriam-haile",
    "Miriam Haile",
    "ACT-0041",
    "solo",
    ["solo-vocalist"],
    "Etobicoke",
    40,
    300,
    null,
    0,
  );

  // Thirty artists around Barrie, for paging (L2-010).
  const barrie = point("Barrie");
  const styles = [
    ["band", "hymns"],
    ["solo-vocalist", "acoustic"],
    ["gospel-choir"],
    ["acoustic", "spanish"],
    ["band"],
  ];
  const acts = ["band", "solo", "choir", "duo", "band"];
  SUPPORTING_CAST.forEach((name, index) => {
    const reviewed = (index + 1) % 7 !== 0;
    add(
      slugify(name),
      name,
      `ACT-${String(1001 + index).padStart(4, "0")}`,
      acts[index % 5],
      styles[index % 5],
      "Barrie",
      120,
      300 + ((index * 37) % 20) * 100,
      reviewed ? Math.round((4.0 + ((index * 13) % 11) / 10) * 10) / 10 : null,
      reviewed ? 3 + ((index * 7) % 30) : 0,
      {
        at: {
          lat: barrie.lat + (index % 6) * 0.004,
          lng: barrie.lng + Math.floor(index / 6) * 0.006,
        },
      },
    );
  });

  // Gospel choirs for the sold-out state (L2-011): unavailable every weekday, free on these dates.
  const choirs = [
    [
      "lakeshore-gospel-voices",
      "Lakeshore Gospel Voices",
      "ACT-0061",
      { lat: 43.4675, lng: -79.6877 },
      1500,
      4.7,
      12,
      ["2026-12-20", "2026-12-23", "2026-12-27"],
    ],
    [
      "hamilton-mountain-mass-choir",
      "Hamilton Mountain Mass Choir",
      "ACT-0062",
      { lat: 43.21, lng: -79.86 },
      1700,
      4.8,
      15,
      ["2026-12-20", "2026-12-27"],
    ],
    [
      "halton-praise-choir",
      "Halton Praise Choir",
      "ACT-0063",
      { lat: 43.5183, lng: -79.8774 },
      1200,
      4.5,
      8,
      ["2026-12-27"],
    ],
    [
      "durham-gospel-choir",
      "Durham Gospel Choir",
      "ACT-0064",
      point("Ajax"),
      1900,
      4.6,
      10,
      ["2026-12-24"],
    ],
  ];
  for (const [
    slug,
    name,
    ticket,
    at,
    dollars,
    rating,
    reviews,
    free,
  ] of choirs) {
    add(
      slug,
      name,
      ticket,
      "choir",
      ["gospel-choir"],
      "Burlington",
      120,
      dollars,
      rating,
      reviews,
      {
        at,
        weeklyUnavailable: [1, 2, 3, 4, 5, 6, 7],
        overrides: Object.fromEntries(free.map((d) => [d, "free"])),
      },
    );
  }

  const bySlug = Object.fromEntries(
    artists.map((artist) => [artist.slug, artist]),
  );
  // Confirmed bookings block their dates; those confirmed since 1 Sep count towards the headliner.
  for (const [slug, date, confirmedThisSeason] of [
    ["abigail-mensah", "2026-10-18", true],
    ["abigail-mensah", "2026-11-01", true],
    ["abigail-mensah", "2026-11-15", true],
    ["abigail-mensah", "2026-11-21", true],
    ["abigail-mensah", "2026-12-13", true],
    ["abigail-mensah", "2026-12-20", true],
    ["marcus-bell-trio", "2026-10-25", true],
  ]) {
    bySlug[slug].confirmedDates.push(date);
    if (confirmedThisSeason) bySlug[slug].confirmedThisSeason += 1;
  }
  for (const [
    slug,
    [pronoun, headline, aboutHeading, bio, setlist],
  ] of Object.entries(PROFILES)) {
    Object.assign(bySlug[slug], {
      pronoun,
      headline,
      aboutHeading,
      bio,
      setlist,
    });
  }
  return artists;
}

export const ARTISTS = buildArtists();

/** The most recent visible 5-star review per artist, as the headliner quotes it. */
export const HEADLINER_QUOTES = {
  "abigail-mensah": {
    text: "She had the whole congregation singing in three-part harmony by the last verse.",
    reviewerName: "Rev. Janet Clarke",
    city: "Oshawa",
  },
};
