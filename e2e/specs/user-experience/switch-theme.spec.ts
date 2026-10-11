import { expect, test } from '@playwright/test';
import { accountTheme, createBooker, signIn } from '../../fixtures/accounts';
import { DiscoverPage } from '../../pages/discover.page';

// L2-104.1–3 (user-experience/switch-theme): the choice is kept on the device.
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

// L2-104.2 (user-experience/switch-theme): a signed-in person's choice is also saved to the account.
test.describe('The theme on an account', () => {
  test('a signed-in choice is saved and follows the person to another browser', async ({
    page,
    browser,
  }) => {
    const discover = new DiscoverPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await discover.useSystemTheme('light');
    await discover.openAndHydrate();
    await expect(discover.shell.accountButton()).toBeVisible();

    const saved = discover.shell.nextThemeSave();
    await discover.shell.toggleTheme();
    expect(await saved).toBe('dark');

    const other = await browser.newContext({ colorScheme: 'light' });
    const elsewhere = new DiscoverPage(await other.newPage());
    await signIn(other.request, booker.email);
    await elsewhere.openAndHydrate();
    await expect(elsewhere.shell.themeToggle()).toHaveAttribute('aria-pressed', 'true');
    expect(await elsewhere.shell.paintedTheme()).toBe('dark');
    expect(await elsewhere.shell.deviceTheme()).toBe('dark');
    await elsewhere.reload();
    expect(await elsewhere.shell.paintedTheme()).toBe('dark');
    await other.close();
  });

  test('a choice already on the device is saved to an account that has none', async ({ page }) => {
    const discover = new DiscoverPage(page);
    const booker = createBooker();
    await signIn(page.request, booker.email);
    await discover.useSystemTheme('light');
    await discover.rememberThemeOnDevice('dark');

    const saved = discover.shell.nextThemeSave();
    await discover.openAndHydrate();

    expect(await saved).toBe('dark');
    expect(await accountTheme(page.request)).toBe('dark');
    expect(await discover.shell.paintedTheme()).toBe('dark');
  });

  test('a guest’s choice stays on the device', async ({ page }) => {
    const discover = new DiscoverPage(page);
    await discover.useSystemTheme('light');
    await discover.openAndHydrate();
    const saves = discover.shell.countThemeSaves();

    await discover.shell.toggleTheme();

    await expect(discover.shell.themeToggle()).toHaveAttribute('aria-pressed', 'true');
    expect(await discover.shell.deviceTheme()).toBe('dark');
    expect(saves()).toBe(0);
  });
});
