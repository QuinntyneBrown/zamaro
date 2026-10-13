import { Dialog as CdkDialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { createGlobalPositionStrategy } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, type Injector } from '@angular/core';
import { translateSignal } from '@jsverse/transloco';
import { ThemeService } from 'api';
import { Dialog, Menu, type MenuItem, type TopBarLink } from 'components';

export const MENU_TITLE_ID = 'menu-title';
export const MENU_DESCRIPTION_ID = 'menu-description';

/**
 * Opens the admin drawer at the left edge (docs/mocks/dialogs/menu/admin). It traps focus, closes on
 * Escape or the backdrop, and returns focus to the menu button (L2-101.4).
 */
export function openAdminMenuDialog(
  injector: Injector,
  id: string,
  links: readonly TopBarLink[],
): DialogRef<unknown, AdminMenuDialog> {
  return injector.get(CdkDialog).open(AdminMenuDialog, {
    id,
    data: links,
    ariaLabelledBy: MENU_TITLE_ID,
    ariaDescribedBy: MENU_DESCRIPTION_ID,
    autoFocus: 'first-tabbable',
    restoreFocus: true,
    backdropClass: 'zm-backdrop',
    positionStrategy: createGlobalPositionStrategy(injector).left('0').top('0'),
  });
}

/** The admin sections below XL, with their counts, then the theme toggle. */
@Component({
  selector: 'zm-admin-menu-dialog',
  imports: [Dialog, Menu],
  template: `<zm-dialog
    variant="drawer"
    [heading]="title()"
    [titleId]="titleId"
    [closeLabel]="closeLabel()"
    (closed)="dialogRef.close()"
  >
    <p class="text-muted" [id]="descriptionId">{{ description() }}</p>
    <nav [attr.aria-label]="navLabel()">
      <zm-menu [items]="items()" (chosen)="dialogRef.close()" (activated)="theme.toggle()" />
    </nav>
  </zm-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMenuDialog {
  protected readonly dialogRef = inject(DialogRef);
  protected readonly theme = inject(ThemeService);
  private readonly links = inject<readonly TopBarLink[]>(DIALOG_DATA);
  protected readonly titleId = MENU_TITLE_ID;
  protected readonly descriptionId = MENU_DESCRIPTION_ID;

  protected readonly title = translateSignal('common.menu.title');
  protected readonly description = translateSignal('admin.menu.description');
  protected readonly closeLabel = translateSignal('common.menu.close');
  protected readonly navLabel = translateSignal('common.menu.label');
  private readonly darkTheme = translateSignal('common.theme.dark');

  protected readonly items = computed<MenuItem[]>(() => [
    ...this.links.map((item): MenuItem => ({
      kind: 'link',
      label: item.label,
      link: typeof item.link === 'string' ? item.link : String(item.link),
      count: item.count ?? undefined,
      countLabel: item.countLabel,
    })),
    { kind: 'separator' },
    {
      kind: 'toggle',
      id: 'theme',
      label: this.darkTheme(),
      icon: 'moon',
      pressed: this.theme.isDark(),
    },
  ]);
}
