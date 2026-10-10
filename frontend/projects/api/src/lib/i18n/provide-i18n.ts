import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { firstValueFrom } from 'rxjs';
import { CatalogueLoader } from './catalogue.loader';

export const DEFAULT_LOCALE = 'en';

/**
 * True when no page is being rendered, so the catalogue need not load before bootstrap. The server
 * binds it to Angular's `IS_DISCOVERING_ROUTES`, which is true only while the build extracts routes.
 */
export const SKIP_CATALOGUE_PRELOAD = new InjectionToken<boolean>('SKIP_CATALOGUE_PRELOAD', {
  factory: () => false,
});

/** Transloco with ICU messages, the catalogue loaded before the first render (L2-111). */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [DEFAULT_LOCALE],
        defaultLang: DEFAULT_LOCALE,
        fallbackLang: DEFAULT_LOCALE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: CatalogueLoader,
    }),
    provideTranslocoMessageformat(),
    provideAppInitializer(() =>
      inject(SKIP_CATALOGUE_PRELOAD)
        ? undefined
        : firstValueFrom(inject(TranslocoService).load(DEFAULT_LOCALE)),
    ),
  ]);
}
