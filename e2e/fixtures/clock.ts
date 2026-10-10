import type { Page } from '@playwright/test';

/** The app's "today": Fri 9 Oct 2026, 10:00 Toronto time (docs/mocks/README.md). */
export const FROZEN_NOW = new Date('2026-10-09T10:00:00-04:00');

export async function freezeClock(page: Page): Promise<void> {
  await page.clock.setFixedTime(FROZEN_NOW);
}

/** Starts the app's clock at the frozen "today" and lets it run, so a test can jump it ahead. */
export async function startClock(page: Page): Promise<void> {
  await page.clock.install({ time: FROZEN_NOW });
}

/** Jumps the clock ahead, firing every timer that falls due on the way. */
export async function passTime(page: Page, ms: number): Promise<void> {
  await page.clock.fastForward(ms);
}
