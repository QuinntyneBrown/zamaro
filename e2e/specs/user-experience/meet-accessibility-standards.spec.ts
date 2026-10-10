import { expect, test } from '@playwright/test';
import { DiscoverPage } from '../../pages/discover.page';

// L2-103.1
test.describe('Reduced motion', () => {
  test('turns off smooth scrolling and the menu’s slide-in', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await discover.preferReducedMotion();
    await discover.useWidth(375);
    await discover.openAndHydrate();

    expect(await discover.shell.scrollBehavior()).toBe('auto');
    const menu = await discover.shell.openMenu();
    await expect(menu.dialog()).toBeVisible();
    expect(await menu.animationMs()).toBeLessThanOrEqual(0.01);
  });
});
