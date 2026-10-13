import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { createGlobalPositionStrategy } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, type Injector } from '@angular/core';
import { translateSignal } from '@jsverse/transloco';
import type { CurrentUser } from 'api';
import { Dialog, Menu, type MenuItem, type MenuWho } from 'components';

export const ACCOUNT_MENU_TITLE_ID = 'account-title';
export const ACCOUNT_MENU_WHO_ID = 'account-who';

/** What the menu closes with: `sign-out` when the administrator chose Sign out. */
export type AdminAccountMenuResult = 'sign-out' | undefined;

/** Opens the account menu under the top bar's right edge, as in the public application (L2-101.4). */
export function openAdminAccountMenuDialog(
  injector: Injector,
  id: string,
  user: CurrentUser,
): DialogRef<AdminAccountMenuResult, AdminAccountMenuDialog> {
  return injector
    .get(CdkDialog)
    .open<AdminAccountMenuResult, CurrentUser, AdminAccountMenuDialog>(AdminAccountMenuDialog, {
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

/** Who is signed in (name, "Zamaro team", email), then Sign out. */
@Component({
  selector: 'zm-admin-account-menu-dialog',
  imports: [Dialog, Menu],
  template: `<zm-dialog variant="menu" [heading]="title()" [titleId]="titleId">
    <zm-menu
      [who]="who()"
      [whoId]="whoId"
      [items]="items()"
      (chosen)="dialogRef.close()"
      (activated)="dialogRef.close('sign-out')"
    />
  </zm-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccountMenuDialog {
  protected readonly dialogRef = inject<DialogRef<AdminAccountMenuResult>>(DialogRef);
  private readonly user = inject<CurrentUser>(DIALOG_DATA);
  protected readonly titleId = ACCOUNT_MENU_TITLE_ID;
  protected readonly whoId = ACCOUNT_MENU_WHO_ID;

  protected readonly title = translateSignal('common.account.open', { name: this.user.name });
  private readonly team = translateSignal('admin.footer.team');
  private readonly signOut = translateSignal('common.account.signOut');

  protected readonly who = computed<MenuWho>(() => ({
    name: this.user.name,
    detail: this.team(),
    note: this.user.email,
  }));

  protected readonly items = computed<MenuItem[]>(() => [
    { kind: 'action', id: 'sign-out', label: this.signOut(), icon: 'sign-out' },
  ]);
}
