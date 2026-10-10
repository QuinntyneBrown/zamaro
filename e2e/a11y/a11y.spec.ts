import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openRouteState } from '../fixtures/route-states';
import { Shell, type Theme } from '../pages/shell';
import { routes } from '../routes.manifest';

// L2-100.1: axe-core finds no WCAG 2.0, 2.1 or 2.2 A or AA violation on any manifest state, in
// either theme, with the compact header (XS) or the full one (XL) (meet-accessibility-standards).
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const WIDTHS = { xs: 320, xl: 1200 } as const;
const THEMES: Theme[] = ['light', 'dark'];

test.describe('Accessibility', () => {
  for (const state of routes.filter((route) => route.app === 'zamaro')) {
    for (const theme of THEMES) {
      for (const [viewport, width] of Object.entries(WIDTHS)) {
        test(`${state.name} in the ${theme} theme at ${viewport}`, async ({ page }) => {
          const shell = new Shell(page);
          await shell.useSystemTheme(theme);
          await shell.useWidth(width);
          await openRouteState(page, state);

          const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

          expect(
            violations.map((violation) => ({
              rule: violation.id,
              impact: violation.impact,
              help: violation.help,
              nodes: violation.nodes.map((node) => node.target.join(' ')),
            })),
          ).toEqual([]);
        });
      }
    }
  }
});
