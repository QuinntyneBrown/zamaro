// The stub Zamaro API for e2e (AGENTS.md: "The backend is mocked in e2e"). Playwright starts it
// beside the SSR server, whose API_ORIGIN points here, so the server's own fetches and the browser's
// proxied /api calls both reach it. It answers every /api/v1 endpoint the zamaro app calls with the
// response shapes of backend/app/Http/Resources, computed from the seeded cast (./cast.mjs) the way
// backend/app/Actions/Discovery does, with today frozen at Fri 9 Oct 2026 10:00 in Toronto.
//
// It is stateless and the same for every test. A test that needs another API state (slow, failed,
// rate-limited, an altered profile) intercepts the browser's request with `page.route` in its page
// object; no test needs a different server-side render.

import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARTISTS,
  CITY_HALL,
  HEADLINER_QUOTES,
  geocode,
  roadDistance,
} from "./cast.mjs";

const PORT = Number(process.env["STUB_API_PORT"] ?? 8001);
const CATALOGUES = fileURLToPath(
  new URL("../../../backend/resources/i18n/", import.meta.url),
);
const PROBLEMS = "http://localhost/problems";

/** Fri 9 Oct 2026 in Toronto (docs/mocks/README.md). */
const TODAY = "2026-10-09";
/** Bookings confirmed from 1 Sep count towards "Most booked this autumn". */
const SEASON = "autumn";
const RADII_KM = [40, 80, 120, 200];
const KINDS = [
  "sunday-service",
  "worship-night",
  "youth-event",
  "conference-or-retreat",
  "wedding",
  "funeral-or-memorial",
];
const STYLES = [
  "band",
  "solo-vocalist",
  "gospel-choir",
  "acoustic",
  "hymns",
  "spanish",
];
const SORTS = ["closest", "rating", "price"];
const PER_PAGE = 24;
const UNDER_800_CENTS = 80000;
const LOCATION_MISSING =
  "Enter your church’s address or town, or pick a city below.";

// ---------- Dates ----------------------------------------------------------------------------

const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
const toIso = (date) => date.toISOString().slice(0, 10);
const addDays = (iso, days) =>
  toIso(new Date(toDate(iso).getTime() + days * 86_400_000));
const isoWeekday = (iso) => toDate(iso).getUTCDay() || 7;

/** 18 months on, the day clamped to the month's length (Carbon addMonthsNoOverflow). */
function addMonthsNoOverflow(iso, months) {
  const date = toDate(iso);
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return toIso(target);
}

const EARLIEST = addDays(TODAY, 3);
const LATEST = addMonthsNoOverflow(TODAY, 18);

// ---------- Domain (backend/app/Services/Discovery, AvailabilityService) ----------------------

/** Free on the date (L2-005): override beats the weekly rule; a Confirmed booking blocks the day. */
function isFree(artist, date, kind) {
  const override = artist.overrides[date];
  const free = override
    ? override === "free"
    : !artist.weeklyUnavailable.includes(isoWeekday(date));
  if (!free || artist.confirmedDates.includes(date)) return false;
  return (
    kind !== "youth-event" ||
    (artist.verifiedCheckUntil !== null && artist.verifiedCheckUntil >= date)
  );
}

/** Visible artists in the bounding box who pass the filters, each measured by road (CandidateFinder). */
function candidates(criteria, boxRadiusKm) {
  const latSpan = boxRadiusKm / 111;
  const lngSpan =
    boxRadiusKm / (111 * Math.cos((criteria.location.lat * Math.PI) / 180));
  return ARTISTS.filter(
    (artist) =>
      Math.abs(artist.at.lat - criteria.location.lat) <= latSpan &&
      Math.abs(artist.at.lng - criteria.location.lng) <= lngSpan &&
      (criteria.styles.length === 0 ||
        artist.styles.some((style) => criteria.styles.includes(style))) &&
      (!criteria.under800 || artist.fromCents < UNDER_800_CENTS),
  ).map((artist) => ({
    artist,
    distance: roadDistance(criteria.location, artist.at),
  }));
}

/** The travel rule (L2-003): within both the radius and the artist's own limit. */
const travels = (card, radiusKm) =>
  card.distance.km <= radiusKm && card.distance.km <= card.artist.maxDriveKm;

/** PHP's `<=>` on equal-length lists. */
function compare(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/** LineupSorter::key: smaller keys come first; artist id closes every order. */
function sortKey(card, sort) {
  const rating = card.artist.rating;
  switch (sort) {
    case "rating":
      return [
        rating === null ? 1 : 0,
        -(rating ?? 0),
        -card.artist.reviewCount,
        card.distance.km,
        card.artist.id,
      ];
    case "price":
      return [card.artist.fromCents, card.distance.km, card.artist.id];
    default:
      return [card.distance.km, -(rating ?? 0), card.artist.id];
  }
}

/** HeadlinerPicker: most bookings confirmed this season, then rating, distance, lower id. */
function pickHeadliner(cards) {
  const rank = (card) => [
    card.artist.confirmedThisSeason,
    card.artist.rating ?? 0,
    -card.distance.km,
    -card.artist.id,
  ];
  return [...cards].sort((a, b) => compare(rank(b), rank(a)))[0] ?? null;
}

const encodeCursor = (sort, key) =>
  Buffer.from(JSON.stringify({ s: sort, k: key })).toString("base64url");

function decodeCursor(cursor, sort) {
  try {
    const data = JSON.parse(Buffer.from(cursor, "base64url").toString());
    return data?.s === sort &&
      Array.isArray(data.k) &&
      data.k.every((part) => typeof part === "number")
      ? data.k
      : null;
  } catch {
    return null;
  }
}

function search(criteria) {
  const cards = candidates(criteria, criteria.radiusKm).filter(
    (card) =>
      isFree(card.artist, criteria.date, criteria.kind) &&
      travels(card, criteria.radiusKm),
  );
  const headliner = pickHeadliner(cards);
  let tickets = cards
    .filter((card) => card !== headliner)
    .sort((a, b) =>
      compare(sortKey(a, criteria.sort), sortKey(b, criteria.sort)),
    );
  const firstPage = criteria.after === null;
  if (!firstPage)
    tickets = tickets.filter(
      (card) => compare(sortKey(card, criteria.sort), criteria.after) > 0,
    );
  const size = firstPage && headliner ? PER_PAGE - 1 : PER_PAGE;
  const page = tickets.slice(0, size);
  const last = page.at(-1);
  return {
    data: page.map(lineupCard),
    headliner:
      firstPage && headliner
        ? {
            ...lineupCard(headliner),
            season: SEASON,
            quote: HEADLINER_QUOTES[headliner.artist.slug] ?? null,
          }
        : null,
    meta: {
      total: cards.length,
      perPage: PER_PAGE,
      nextCursor:
        tickets.length > size && last
          ? encodeCursor(criteria.sort, sortKey(last, criteria.sort))
          : null,
      sort: criteria.sort,
      styles: criteria.styles,
      price: criteria.under800 ? "under-800" : null,
    },
  };
}

/** FindSearchAlternatives: up to three nearby dates and the smallest wider radius with matches. */
function alternatives(criteria) {
  const wider = RADII_KM.filter((km) => km > criteria.radiusKm);
  const pool = candidates(
    criteria,
    wider.length ? Math.max(...wider) : criteria.radiusKm,
  );
  const countFree = (date, radiusKm) =>
    pool.filter(
      (card) =>
        isFree(card.artist, date, criteria.kind) && travels(card, radiusKm),
    ).length;

  const nearbyDates = [];
  for (let days = 1; days <= 7 && nearbyDates.length < 3; days++) {
    for (const offset of [-days, days]) {
      const date = addDays(criteria.date, offset);
      if (date < EARLIEST || date > LATEST) continue;
      const count = countFree(date, criteria.radiusKm);
      if (count > 0) nearbyDates.push({ date, count });
      if (nearbyDates.length === 3) break;
    }
  }
  const radius = wider
    .map((km) => ({ km, count: countFree(criteria.date, km) }))
    .find((r) => r.count > 0);
  return {
    data: {
      nearbyDates,
      widerRadius: radius ?? null,
      filtersApplied: criteria.styles.length > 0 || criteria.under800,
    },
  };
}

function lineupCard({ artist, distance }) {
  return {
    slug: artist.slug,
    name: artist.name,
    actType: artist.actType,
    styles: artist.styles,
    city: artist.baseCity,
    distance,
    rating: artist.rating,
    reviewCount: artist.reviewCount,
    fromPrice: { cents: artist.fromCents, currency: "CAD" },
  };
}

function profile(artist) {
  return {
    data: {
      slug: artist.slug,
      displayName: artist.name,
      firstName:
        artist.actType === "solo" ? artist.name.split(" ")[0] : artist.name,
      pronoun: artist.pronoun ?? "they",
      actType: artist.actType,
      headline: artist.headline ?? null,
      aboutHeading: artist.aboutHeading ?? null,
      bio: artist.bio ?? "",
      baseCity: artist.baseCity,
      maxDriveKm: artist.maxDriveKm,
      fromPrice: { cents: artist.fromCents, currency: "CAD" },
      ticketNumber: artist.ticket,
      rating: artist.rating,
      reviewCount: artist.reviewCount,
      styles: artist.styles,
      setlist: (artist.setlist ?? []).map(([title, writer, key], index) => ({
        position: index + 1,
        title,
        writer,
        key,
      })),
    },
  };
}

// ---------- Requests (SearchArtistsRequest) --------------------------------------------------

/** The search criteria, or the 422 field errors the API would return. */
function readSearch(params) {
  const errors = {};
  const date = params.get("date") ?? "";
  if (!date) errors.date = ["Pick your event date."];
  else if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(toDate(date).getTime())
  )
    errors.date = ["The date field must match the format Y-m-d."];
  else if (date < EARLIEST) errors.date = ["Pick a date at least 3 days away."];
  else if (date > LATEST)
    errors.date = ["We take bookings up to 18 months ahead."];

  const kind = params.get("kind") ?? "";
  if (!KINDS.includes(kind)) errors.kind = ["The selected kind is invalid."];

  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const location = { lat, lng };
  if (
    !params.get("lat") ||
    !params.get("lng") ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    errors.location = [LOCATION_MISSING];
  } else if (roadDistance(CITY_HALL, location).km > 200) {
    errors.location = ["Zamaro serves churches within 200 km of Toronto."];
  }

  const radiusKm = Number(params.get("radius"));
  if (!RADII_KM.includes(radiusKm))
    errors.radius = ["The selected radius is invalid."];

  const sort = params.get("sort") || "closest";
  if (!SORTS.includes(sort)) errors.sort = ["The selected sort is invalid."];

  const styles = params.get("styles") ? params.get("styles").split(",") : [];
  if (styles.some((style) => !STYLES.includes(style)))
    errors.styles = ["Pick styles from the chips."];

  const price = params.get("price");
  if (price && price !== "under-800")
    errors.price = ["The selected price is invalid."];

  const cursor = params.get("cursor");
  const after = cursor
    ? decodeCursor(cursor, SORTS.includes(sort) ? sort : "closest")
    : null;
  if (cursor && after === null)
    errors.cursor = ["Start the search again: these results have changed."];

  if (Object.keys(errors).length) return { errors };
  return {
    criteria: {
      date,
      kind,
      location,
      radiusKm,
      sort,
      styles,
      under800: price === "under-800",
      after,
    },
  };
}

function catalogue(locale) {
  const dir = join(CATALOGUES, locale);
  const messages = {};
  for (const file of readdirSync(dir).filter((name) =>
    name.endsWith(".json"),
  )) {
    const namespace = file.replace(/\.json$/, "");
    for (const [key, message] of Object.entries(
      JSON.parse(readFileSync(join(dir, file), "utf8")),
    )) {
      messages[`${namespace}.${key}`] = message;
    }
  }
  return {
    data: {
      locale,
      messages: Object.fromEntries(
        Object.entries(messages).sort(([a], [b]) => (a < b ? -1 : 1)),
      ),
    },
  };
}

// ---------- HTTP -----------------------------------------------------------------------------

const problem = (status, slug, title, detail, errors) => ({
  status,
  type: "application/problem+json",
  body: {
    type: `${PROBLEMS}/${slug}`,
    title,
    status,
    detail,
    requestId: null,
    ...(errors ? { errors } : {}),
  },
});
const notFound = (detail) => problem(404, "not-found", "Not found", detail);
const ok = (body, cache = "no-cache, private") => ({
  status: 200,
  type: "application/json",
  body,
  cache,
});
/** The catalogue and the profile are public and shared, as the API sends them. */
const SHARED = "public, max-age=0, s-maxage=60";

function respond(url) {
  const path = url.pathname;
  let match;
  if ((match = path.match(/^\/api\/v1\/i18n\/([^/]+)$/))) {
    const locale = decodeURIComponent(match[1]);
    return locale === "en"
      ? ok(catalogue(locale), SHARED)
      : notFound(`No catalogue for locale ${locale}.`);
  }
  if (path === "/api/v1/places") {
    const q = url.searchParams.get("q") ?? "";
    if (!q.trim())
      return problem(
        422,
        "validation-failed",
        "Check the highlighted fields",
        LOCATION_MISSING,
        { q: [LOCATION_MISSING] },
      );
    const place = geocode(q);
    return place
      ? ok({ data: place })
      : notFound("No place matches that name.");
  }
  if (path === "/api/v1/search" || path === "/api/v1/search/alternatives") {
    const { criteria, errors } = readSearch(url.searchParams);
    if (errors) {
      const first = Object.values(errors)[0][0];
      return problem(
        422,
        "validation-failed",
        "Check the highlighted fields",
        first,
        errors,
      );
    }
    return ok(
      path === "/api/v1/search"
        ? search(criteria)
        : alternatives({ ...criteria, after: null }),
    );
  }
  if ((match = path.match(/^\/api\/v1\/artists\/([^/]+)$/))) {
    const artist = ARTISTS.find(
      (candidate) => candidate.slug === decodeURIComponent(match[1]),
    );
    return artist
      ? ok(profile(artist), SHARED)
      : notFound("No artist has that address.");
  }
  return notFound("No route matches that address.");
}

createServer((request, response) => {
  const result = respond(
    new URL(request.url ?? "/", `http://localhost:${PORT}`),
  );
  response.writeHead(result.status, {
    "Content-Type": result.type,
    "Cache-Control": result.cache ?? "no-cache, private",
  });
  response.end(JSON.stringify(result.body));
}).listen(PORT, () =>
  console.log(`Stub API listening on http://localhost:${PORT}`),
);
