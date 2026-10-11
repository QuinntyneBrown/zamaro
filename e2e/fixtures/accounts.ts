import {
  type APIRequestContext,
  type BrowserContext,
  type Cookie,
  request,
} from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { totp } from "./totp";

/**
 * The cast members who can sign in (M2 plan D28). The e2e API seeds them with this password;
 * docker-compose.yml passes the same value to `api-e2e`.
 */
export const CAST_PASSWORD =
  process.env["ZAMARO_CAST_PASSWORD"] ?? "hosanna-in-the-highest";

/** The site as playwright.config.ts serves it: on localhost, since Chromium drops Secure cookies on 127.0.0.1. */
const SITE = "http://localhost:4000";

export const accounts = {
  naomi: { name: "Naomi Fraser", email: "naomi.fraser@riversidecc.ca" },
  abigail: { name: "Abigail Mensah", email: "abigail@abigailmensah.ca" },
  tomi: { name: "Tomi Oduya", email: "tomi.oduya@harvestpointchurch.ca" },
} as const;

export type CastMember = keyof typeof accounts;

/**
 * An address no other spec, worker or run uses, so specs that change data never meet. Mailpit
 * lookups filter by it too.
 */
export function uniqueEmail(label = "booker"): string {
  return `${label}-${randomUUID().slice(0, 8)}@e2e.zamaro.test`;
}

/**
 * Signs in through the web server's /sanctum and /api proxy, as the browser would, so the session
 * and XSRF-TOKEN cookies land on the site's origin. A request context taken from a browser context
 * (`page.request`) shares its cookies, so the page is signed in afterwards.
 */
export async function signIn(
  request: APIRequestContext,
  email: string,
  password: string = CAST_PASSWORD,
): Promise<void> {
  // Sanctum only starts a session for requests that come from a web origin (ADR-0015).
  const fromSite = { Referer: `${SITE}/` };
  await request.get("/sanctum/csrf-cookie", { headers: fromSite });
  const token = await xsrfToken(request);
  const response = await request.post("/api/v1/session", {
    headers: { ...fromSite, Accept: "application/json", "X-XSRF-TOKEN": token },
    data: { email, password },
  });
  if (!response.ok()) {
    throw new Error(
      `Signing in ${email} failed with ${response.status()}: ${await response.text()}`,
    );
  }
}

/**
 * Tries to sign in with a wrong password `times` times through the API, as a person mistyping it
 * would, so the next try meets the lockout (L2-072.4).
 */
export async function failSignIns(
  request: APIRequestContext,
  email: string,
  times: number,
): Promise<void> {
  const fromSite = { Referer: `${SITE}/` };
  await request.get("/sanctum/csrf-cookie", { headers: fromSite });
  const token = await xsrfToken(request);
  for (let i = 0; i < times; i++) {
    const response = await request.post("/api/v1/session", {
      headers: {
        ...fromSite,
        Accept: "application/json",
        "X-XSRF-TOKEN": token,
      },
      data: { email, password: "not-the-right-password" },
    });
    if (response.status() !== 422) {
      throw new Error(
        `A wrong password for ${email} got ${response.status()}, not 422.`,
      );
    }
  }
}

/** Signs a cast member into a browser context, so every page opened in it is signed in. */
export async function signInAs(
  context: BrowserContext,
  member: CastMember,
): Promise<void> {
  await signIn(context.request, accounts[member].email);
}

/**
 * A fresh booker in the e2e database, made with the `cast:booker` artisan helper (D19). Registration
 * itself is tested through the sign-up page; this is for specs that need an account to change.
 * `verified: false` leaves the address waiting for its link; `terms` is the terms version they last
 * accepted (the current one unless given).
 */
export function createBooker(
  email: string = uniqueEmail(),
  { verified = true, terms }: { verified?: boolean; terms?: string } = {},
): { email: string; password: string } {
  execFileSync(
    "docker",
    [
      "compose",
      "--profile",
      "e2e",
      "exec",
      "-T",
      "api-e2e",
      "php",
      "artisan",
      "cast:booker",
      email,
      ...(verified ? [] : ["--unverified"]),
      ...(terms ? [`--terms=${terms}`] : []),
    ],
    { cwd: new URL("../..", import.meta.url), stdio: "pipe" },
  );
  return { email, password: CAST_PASSWORD };
}

/** What `GET /api/v1/me` answers a browser holding only this session cookie: 200 or 401. */
export async function meStatusWith(sessionCookie: Cookie): Promise<number> {
  const context = await request.newContext({
    baseURL: SITE,
    storageState: { cookies: [sessionCookie], origins: [] },
  });
  try {
    const response = await context.get("/api/v1/me", {
      headers: { Referer: `${SITE}/`, Accept: "application/json" },
    });
    return response.status();
  } finally {
    await context.dispose();
  }
}

/** What `GET /api/v1/me` answers a browser context: 200 while signed in, 401 once its session ended. */
export async function meStatusIn(context: BrowserContext): Promise<number> {
  const response = await context.request.get("/api/v1/me", {
    headers: { Referer: `${SITE}/`, Accept: "application/json" },
  });
  return response.status();
}

/**
 * Turns on two-step sign-in for the person signed in on `request`, as the setup page does: asks for a
 * key, then confirms it with the current code. Answers the key and the 10 recovery codes.
 */
export async function turnOnTwoFactor(
  request: APIRequestContext,
): Promise<{ secret: string; recoveryCodes: string[] }> {
  const headers = {
    Referer: `${SITE}/`,
    Accept: "application/json",
    "X-XSRF-TOKEN": await xsrfToken(request),
  };
  const begun = await request.post("/api/v1/account/two-factor", { headers });
  if (!begun.ok())
    throw new Error(`Beginning two-step sign-in got ${begun.status()}.`);
  const secret = (
    (await begun.json()) as { data: { key: string } }
  ).data.key.replace(/\s/g, "");
  const confirmed = await request.post("/api/v1/account/two-factor/confirm", {
    headers: { ...headers, "X-XSRF-TOKEN": await xsrfToken(request) },
    data: { code: totp(secret) },
  });
  if (!confirmed.ok())
    throw new Error(`Confirming two-step sign-in got ${confirmed.status()}.`);
  const { recoveryCodes } = (
    (await confirmed.json()) as { data: { recoveryCodes: string[] } }
  ).data;
  return { secret, recoveryCodes };
}

/** Saves an artist for the person signed in on `request`, as a heart would (accounts/save-artist). */
export async function saveArtist(
  request: APIRequestContext,
  slug: string,
): Promise<void> {
  const profile = await request.get(`/api/v1/artists/${slug}`, {
    headers: { Accept: "application/json" },
  });
  const id = ((await profile.json()) as { data: { id: number } }).data.id;
  const saved = await request.put(`/api/v1/saved-artists/${id}`, {
    headers: {
      Referer: `${SITE}/`,
      Accept: "application/json",
      "X-XSRF-TOKEN": await xsrfToken(request),
    },
  });
  if (!saved.ok()) throw new Error(`Saving ${slug} got ${saved.status()}.`);
}

async function xsrfToken(request: APIRequestContext): Promise<string> {
  const { cookies } = await request.storageState();
  const cookie = cookies.find((candidate) => candidate.name === "XSRF-TOKEN");
  if (!cookie) throw new Error("The API set no XSRF-TOKEN cookie.");
  return decodeURIComponent(cookie.value);
}
