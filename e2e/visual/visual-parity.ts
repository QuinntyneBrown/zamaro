import { expect, test } from '@playwright/test';
import { openRouteState } from '../fixtures/route-states';
import { Shell, type Theme } from '../pages/shell';
import { type RouteState, routes } from '../routes.manifest';

// L2-096.2: every manifest state at one width per viewport class, light and dark, against the
// committed baselines (adapt-layout-to-screens). Run with --update-snapshots only for an intended
// design change, and review the new baselines against docs/mocks in the same change.
const WIDTHS = { xs: 320, sm: 576, md: 768, lg: 992, xl: 1200 } as const;
const THEMES: Theme[] = ['light', 'dark'];

/** Declares the visual parity tests of one application's route states; each project runs its own. */
export function visualParity(app: RouteState['app']): void {
  test.describe('Visual parity', () => {
    test.describe.configure({ timeout: 120_000 });

    for (const state of routes.filter((route) => route.app === app)) {
      for (const theme of THEMES) {
        test(`${state.name} in the ${theme} theme`, async ({ page }) => {
          const shell = new Shell(page);
          await shell.useSystemTheme(theme);
          await shell.useWidth(WIDTHS.xs);
          const mask = await openRouteState(page, state);

          for (const [viewport, width] of Object.entries(WIDTHS)) {
            await shell.useWidth(width);
            await shell.settle();
            await expect.soft(page).toHaveScreenshot(`${state.name}-${viewport}-${theme}.png`, {
              fullPage: true,
              mask,
            });
          }
        });
      }
    }
  });
}
