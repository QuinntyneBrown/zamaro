import { expect, test } from "@playwright/test";
import {
  createBooker,
  saveArtist,
  signIn,
  signInAs,
} from "../../fixtures/accounts";
import { DiscoverPage } from "../../pages/discover.page";
import { SavedPage } from "../../pages/saved.page";
import { SignInPage } from "../../pages/sign-in.page";
import { Toasts } from "../../pages/toasts";

/** Naomi's last search: Burlington, Sat 14 Nov, a worship night, within 120 km. */
const BURLINGTON = {
  date: "2026-11-14",
  kind: "worship-night",
  lat: "43.325",
  lng: "-79.799",
  place: "Burlington",
  radius: "120",
};

// L2-027 and L2-105 (accounts/view-saved-artists).
test.describe("Saved artists", () => {
  test("Naomi’s saved artists, newest first, free on her last search date", async ({
    page,
  }) => {
    const discover = new DiscoverPage(page);
    const saved = new SavedPage(page);
    await signInAs(page.context(), "naomi");
    await discover.openLink(BURLINGTON);
    await expect(discover.lineup.tickets().first()).toBeVisible();

    await discover.shell.savedLink().click();

    await expect(saved.heading()).toHaveText("Saved artists");
    expect(saved.path()).toBe("/saved");
    await expect(saved.subtitle()).toHaveText(
      "3 saved · free or booked on Sat 14 Nov, your last search",
    );
    await expect(saved.dateField()).toHaveValue("2026-11-14");
    await expect(saved.cardNames()).toHaveText([
      "Abigail Mensah",
      "Hosanna Collective",
      "Luz Viva",
    ]);
    const abigail = saved.card("Abigail Mensah");
    await expect(abigail.kicker()).toHaveText("Saved Wed 7 Oct");
    await expect(saved.card("Hosanna Collective").kicker()).toHaveText(
      "Saved Sun 27 Sep",
    );
    await expect(saved.card("Luz Viva").kicker()).toHaveText(
      "Saved Sat 12 Sep",
    );
    await expect(abigail.meta()).toHaveText(
      "Solo vocalist · HymnsBrampton · 44 km from you",
    );
    await expect(abigail.price()).toHaveText("From$650");
    await expect(abigail.availability()).toHaveText("Free Sat 14 Nov");
    await expect(abigail.requestLink()).toHaveAccessibleName(
      "Request Abigail Mensah for Sat 14 Nov",
    );
    await expect(abigail.requestLink()).toHaveAttribute(
      "href",
      "/artists/abigail-mensah?date=2026-11-14",
    );
    await expect(abigail.nameLink()).toHaveAttribute(
      "href",
      "/artists/abigail-mensah?date=2026-11-14",
    );
    await expect(abigail.saveToggle()).toHaveAttribute("aria-pressed", "true");
    await expect(saved.note()).toHaveText(
      "Only you can see who you saved. Tap a heart to remove an artist; you can undo it.",
    );
    await expect(saved.shell.savedLink()).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("Check date re-checks every artist, and a booked one offers its free dates", async ({
    page,
  }) => {
    const discover = new DiscoverPage(page);
    const saved = new SavedPage(page);
    await signInAs(page.context(), "naomi");
    await discover.openLink(BURLINGTON);
    await expect(discover.lineup.tickets().first()).toBeVisible();
    await discover.shell.savedLink().click();
    await saved.waitForList();

    await saved.checkDate("2026-11-15");

    await expect(saved.subtitle()).toHaveText(
      "3 saved · free or booked on Sun 15 Nov",
    );
    const abigail = saved.card("Abigail Mensah");
    await expect(abigail.availability()).toHaveText("Booked Sun 15 Nov");
    await expect(abigail.requestLink()).toHaveCount(0);
    await expect(abigail.seeFreeDatesLink()).toHaveAccessibleName(
      "See free dates for Abigail Mensah",
    );
    await expect(abigail.seeFreeDatesLink()).toHaveAttribute(
      "href",
      "/artists/abigail-mensah#dates-title",
    );
    const hosanna = saved.card("Hosanna Collective");
    await expect(hosanna.availability()).toHaveText("Free Sun 15 Nov");
    await expect(hosanna.requestLink()).toHaveAccessibleName(
      "Request Hosanna Collective for Sun 15 Nov",
    );
  });

  test("with no search in this browser, the list asks for a date", async ({
    page,
  }) => {
    const saved = new SavedPage(page);
    await signInAs(page.context(), "naomi");

    await saved.open();

    await expect(saved.subtitle()).toHaveText(
      "3 saved · pick a date to see who’s free",
    );
    await expect(saved.dateField()).toHaveValue("");
    await expect(saved.cardNames()).toHaveText([
      "Abigail Mensah",
      "Hosanna Collective",
      "Luz Viva",
    ]);
    await expect(saved.card("Abigail Mensah").availability()).toHaveCount(0);
    await expect(saved.card("Abigail Mensah").nameLink()).toHaveAttribute(
      "href",
      "/artists/abigail-mensah",
    );
  });

  test("removing an artist takes the card away and Undo brings it back", async ({
    page,
  }) => {
    const saved = new SavedPage(page);
    const toasts = new Toasts(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await saveArtist(page.request, "elijah-park");
    await saveArtist(page.request, "luz-viva");
    await saved.open();
    await expect(saved.cardNames()).toHaveText(["Luz Viva", "Elijah Park"]);

    await saved.card("Luz Viva").saveToggle().click();

    await expect(saved.cardNames()).toHaveText(["Elijah Park"]);
    await expect(saved.subtitle()).toHaveText(
      "1 saved · pick a date to see who’s free",
    );
    await expect(saved.shell.savedLink()).toHaveAccessibleName(
      "Saved 1 artists",
    );
    await toasts.toast("Removed Luz Viva").action("Undo").click();

    await expect(saved.cardNames()).toHaveText(["Luz Viva", "Elijah Park"]);
    await expect(saved.shell.savedLink()).toHaveAccessibleName(
      "Saved 2 artists",
    );
  });

  test("a booker with no saved artists is pointed to Discover", async ({
    page,
  }) => {
    const saved = new SavedPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);

    await saved.open();

    await expect(saved.subtitle()).toHaveText("Nothing saved yet");
    await expect(saved.emptyTitle()).toBeVisible();
    await expect(saved.emptyText()).toHaveText(
      "Tap the heart on any artist to keep them here. You’ll see at a glance who’s free on your date.",
    );
    await expect(saved.findWhosFreeLink()).toHaveAttribute("href", "/");
    await expect(saved.dateField()).toHaveCount(0);
  });

  test("while the list loads, skeleton tickets stand in", async ({ page }) => {
    const saved = new SavedPage(page);
    await signInAs(page.context(), "naomi");
    await saved.holdList();

    await saved.open();

    await expect(saved.loadingStatus()).toHaveText(
      "Loading your saved artists…",
    );
    await expect(saved.skeletons()).toHaveCount(3);
    await expect(saved.main()).toHaveAttribute("aria-busy", "true");
  });

  test("a list that fails to load says so, and Try again loads it", async ({
    page,
  }) => {
    const saved = new SavedPage(page);
    await signInAs(page.context(), "naomi");
    await saved.failList();

    await saved.open();

    await expect(saved.alertTitle()).toHaveText(
      "We couldn’t load your saved artists",
    );
    await expect(saved.alertText()).toHaveText(
      "They’re still saved. Check your connection and try again.",
    );
    await expect(saved.subtitle()).toHaveText("3 saved · list unavailable");
    await expect(saved.backToDiscoverLink()).toHaveAttribute("href", "/");

    await page.unrouteAll();
    await saved.tryAgainButton().click();

    await expect(saved.cardNames()).toHaveText([
      "Abigail Mensah",
      "Hosanna Collective",
      "Luz Viva",
    ]);
  });

  test("a guest is asked to sign in first", async ({ page }) => {
    const saved = new SavedPage(page);
    const signInPage = new SignInPage(page);

    await saved.open();

    await expect(signInPage.heading()).toHaveText("Sign in");
    expect(signInPage.address()).toBe("/sign-in?returnUrl=%2Fsaved");
  });
});
