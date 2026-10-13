import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import type { SaveToggleText } from 'components';

/** The save toggle's names from the catalogue (save-toggle CRD D-3). */
export function saveToggleText(): SaveToggleText {
  const transloco = inject(TranslocoService);
  return {
    save: (name) => transloco.translate('common.saved.toggle.save', { name }),
    remove: (name) => transloco.translate('common.saved.toggle.remove', { name }),
    get and() {
      return transloco.translate('common.and');
    },
  };
}
