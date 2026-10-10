import { expect, test } from '@playwright/test';
import { DiscoverPage } from '../../pages/discover.page';

// L2-104.1–3 (the choice is kept on the device; saving it to the account arrives with sign-in).
test.describe('The theme', () => {
  test('follows the operating system on a first visit', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await discover.useSystemTheme('dark');

    await discover.openAndHydrate();

    expect(await discover.shell.paintedTheme()).toBe('dark');
    await expect(discover.shell.themeToggle()).toHaveAttribute('aria-pressed', 'true');
  });

  test('keeps the visitor’s choice on this device after a reload', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await discover.useSystemTheme('light');
    await discover.openAndHydrate();
    await expect(discover.shell.themeToggle()).toHaveAttribute('aria-pressed', 'false');

    await discover.shell.toggleTheme();
    await expect(discover.shell.themeToggle()).toHaveAttribute('aria-pressed', 'true');
    expect(await discover.shell.paintedTheme()).toBe('dark');

    await discover.reload();
    expect(await discover.shell.paintedTheme()).toBe('dark');
    await expect(discover.shell.themeToggle()).toHaveAttribute('aria-pressed', 'true');
  });

  test('paints a stored dark choice before the app starts', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await discover.useSystemTheme('light');
    await discover.rememberThemeOnDevice('dark');
    await discover.withoutTheApp();

    await discover.open();

    expect(await discover.shell.paintedTheme()).toBe('dark');
  });

  test('can be switched from the menu on a phone', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await discover.useSystemTheme('light');
    await discover.useWidth(375);
    await discover.openAndHydrate();
    const menu = await discover.shell.openMenu();

    await menu.themeToggle().click();

    await expect(menu.themeToggle()).toHaveAttribute('aria-pressed', 'true');
    expect(await discover.shell.paintedTheme()).toBe('dark');
  });
});
