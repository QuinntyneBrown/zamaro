import type { Page } from '@playwright/test';

/** The app's "today": Fri 9 Oct 2026, 10:00 Toronto time (docs/mocks/README.md). */
export const FROZEN_NOW = new Date('2026-10-09T10:00:00-04:00');

export async function freezeClock(page: Page): Promise<void> {
  await page.clock.setFixedTime(FROZEN_NOW);
}
