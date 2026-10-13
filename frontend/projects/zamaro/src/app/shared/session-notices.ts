import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ToastService } from 'components';

/**
 * The `CSRF_REFUSED` notice: an error toast that stays until dismissed, after the token was fetched
 * again and the request still refused (M2 D8).
 */
export function csrfRefusedToast(): () => void {
  const toasts = inject(ToastService);
  const transloco = inject(TranslocoService);
  return () => {
    const title = transloco.translate('common.session.refusedTitle');
    toasts.show({
      variant: 'danger',
      kind: transloco.translate('common.session.refusedKind'),
      title,
      text: transloco.translate('common.session.refusedText'),
      dismissLabel: transloco.translate('common.toast.dismiss', { title }),
      key: 'csrf-refused',
    });
  };
}
