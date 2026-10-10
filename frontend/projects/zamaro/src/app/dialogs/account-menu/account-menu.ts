import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { createGlobalPositionStrategy } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, type Injector } from '@angular/core';
import { translateSignal } from '@jsverse/transloco';
import type { CurrentUser } from 'api';
import { Dialog, Menu, type MenuItem, type MenuWho } from 'components';

export const ACCOUNT_MENU_TITLE_ID = 'account-title';
export const ACCOUNT_MENU_WHO_ID = 'account-who';

/** What the menu closes with: `sign-out` when the person chose Sign out. */
export type AccountMenuResult = 'sign-out' | undefined;

/**
 * Opens the account menu under the top bar's right edge, with no dim (docs/mocks/dialogs/account-menu).
 * It traps focus from the first item, closes on Escape or a click outside, and returns focus to the
 * avatar (L2-101.4).
 */
export function openAccountMenuDialog(
  injector: Injector,
  id: string,
  user: CurrentUser,
): DialogRef<AccountMenuResult, AccountMenuDialog> {
  return injector
    .get(CdkDialog)
    .open<AccountMenuResult, CurrentUser, AccountMenuDialog>(AccountMenuDialog, {
      id,
      data: user,
      ariaLabelledBy: ACCOUNT_MENU_TITLE_ID,
      ariaDescribedBy: ACCOUNT_MENU_WHO_ID,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      positionStrategy: createGlobalPositionStrategy(injector)
        .top('calc(var(--layout-topbar-height) + var(--space-2))')
        .right('var(--layout-margin)'),
    });
}

/**
 * Who is signed in, then Account settings and Sign out. Your bookings and Saved artists join when
 * their screens exist (M2 plan D23, S17); the church joins the who line with the church profile (S9).
 */
@Component({
  selector: 'zm-account-menu-dialog',
  imports: [Dialog, Menu],
  template: `<zm-dialog variant="menu" [heading]="title()" [titleId]="titleId">
    <zm-menu
      [who]="who"
      [whoId]="whoId"
      [items]="items()"
      (chosen)="dialogRef.close()"
      (activated)="dialogRef.close('sign-out')"
    />
  </zm-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenuDialog {
  protected readonly dialogRef = inject<DialogRef<AccountMenuResult>>(DialogRef);
  private readonly user = inject<CurrentUser>(DIALOG_DATA);
  protected readonly titleId = ACCOUNT_MENU_TITLE_ID;
  protected readonly whoId = ACCOUNT_MENU_WHO_ID;

  protected readonly title = translateSignal('common.account.open', { name: this.user.name });
  protected readonly who: MenuWho = { name: this.user.name, note: this.user.email };
  private readonly settings = translateSignal('common.account.settings');
  private readonly signOut = translateSignal('common.account.signOut');

  protected readonly items = computed<MenuItem[]>(() => [
    { kind: 'link', label: this.settings(), icon: 'sliders', link: '/account' },
    { kind: 'separator' },
    { kind: 'action', id: 'sign-out', label: this.signOut(), icon: 'sign-out' },
  ]);
}
