import { expect, test } from '@playwright/test';
import { signInAs } from '../../fixtures/accounts';
import { ArtistWorkspacePage } from '../../pages/artist-workspace.page';
import { SignInPage } from '../../pages/sign-in.page';

// L2-074 and L2-105 (artist-workspace/view-artist-dashboard): the workspace is for artists. A church
// account sees why, in the church's own header; a guest is asked to sign in first.
test.describe('Artist workspace access', () => {
  test('Naomi, a church account, is told the page is for artists', async ({ page }) => {
    const workspace = new ArtistWorkspacePage(page);
    await signInAs(page.context(), 'naomi');

    await workspace.open();

    await expect(workspace.heading()).toHaveText('This page is for artists');
    await expect(workspace.explanation()).toHaveText(
      'You’re signed in as Naomi Fraser, a church account for Riverside Community Church. Requests and availability belong to artist accounts.',
    );
    await expect(workspace.shell.primaryNav().getByRole('link', { name: 'Discover' })).toBeVisible();
    await expect(workspace.roleTag()).toHaveCount(0);
    expect(workspace.location().startsWith('/artist')).toBe(true);
  });

  test('Naomi goes back to Discover or on to applying', async ({ page }) => {
    const workspace = new ArtistWorkspacePage(page);
    await signInAs(page.context(), 'naomi');
    await workspace.open();

    await expect(workspace.applyLink()).toHaveAttribute('href', '/#join');
    await workspace.backToDiscoverLink().click();

    await expect(page).toHaveURL('/');
  });

  test('a guest is sent to sign in and comes back to the workspace', async ({ page }) => {
    const workspace = new ArtistWorkspacePage(page);
    const signIn = new SignInPage(page);

    await workspace.open();

    expect(workspace.location()).toBe('/sign-in?returnUrl=%2Fartist');
    await signIn.signIn('abigail@abigailmensah.ca', 'hosanna-in-the-highest');
    await expect(workspace.roleTag()).toHaveText('Artists');
  });

  test('Abigail sees the workspace bar, not the church bar', async ({ page }) => {
    const workspace = new ArtistWorkspacePage(page);
    await signInAs(page.context(), 'abigail');

    await workspace.open();

    await expect(workspace.roleTag()).toHaveText('Artists');
    await expect(workspace.shell.primaryNavLinks()).toHaveText([
      'Dashboard',
      'Requests',
      'Availability',
      'Earnings',
      'Profile',
    ]);
    await expect(workspace.shell.savedLink()).toHaveCount(0);
  });
});
