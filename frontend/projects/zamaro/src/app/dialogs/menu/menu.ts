import { Dialog as CdkDialog, DialogRef } from '@angular/cdk/dialog';
import { createGlobalPositionStrategy } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, type Injector } from '@angular/core';
import { translateSignal } from '@jsverse/transloco';
import { Dialog, Menu, type MenuItem } from 'components';
import { ThemeService } from '../../shell/theme.service';

export const MENU_TITLE_ID = 'menu-title';

/**
 * Opens the drawer at the left edge. It traps focus, closes on Escape or the backdrop, and
 * returns focus to the menu button (L2-101.4).
 */
export function openMenuDialog(injector: Injector, id: string): DialogRef<unknown, MenuDialog> {
  return injector.get(CdkDialog).open(MenuDialog, {
    id,
    ariaLabelledBy: MENU_TITLE_ID,
    autoFocus: 'first-tabbable',
    restoreFocus: true,
    backdropClass: 'zm-backdrop',
    positionStrategy: createGlobalPositionStrategy(injector).left('0').top('0'),
  });
}

/** The navigation drawer below LG (docs/mocks/dialogs/menu): primary links, then the theme toggle. */
@Component({
  selector: 'zm-menu-dialog',
  imports: [Dialog, Menu],
  template: `<zm-dialog
    variant="drawer"
    [heading]="title()"
    [titleId]="titleId"
    [closeLabel]="closeLabel()"
    (closed)="dialogRef.close()"
  >
    <nav [attr.aria-label]="navLabel()">
      <zm-menu [items]="items()" (chosen)="dialogRef.close()" (toggled)="theme.toggle()" />
    </nav>
  </zm-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuDialog {
  protected readonly dialogRef = inject(DialogRef);
  protected readonly theme = inject(ThemeService);
  protected readonly titleId = MENU_TITLE_ID;

  protected readonly title = translateSignal('common.menu.title');
  protected readonly closeLabel = translateSignal('common.menu.close');
  protected readonly navLabel = translateSignal('common.menu.label');
  private readonly discover = translateSignal('common.nav.discover');
  private readonly how = translateSignal('common.nav.how');
  private readonly forArtists = translateSignal('common.nav.forArtists');
  private readonly darkTheme = translateSignal('common.theme.dark');

  protected readonly items = computed<MenuItem[]>(() => [
    { kind: 'link', label: this.discover(), icon: 'compass', link: '/' },
    { kind: 'link', label: this.how(), icon: 'help', link: '/', fragment: 'how' },
    { kind: 'link', label: this.forArtists(), icon: 'mic', link: '/', fragment: 'join' },
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
