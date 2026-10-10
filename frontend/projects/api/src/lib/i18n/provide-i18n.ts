import {
  type EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { firstValueFrom } from 'rxjs';
import { CatalogueLoader } from './catalogue.loader';

export const DEFAULT_LOCALE = 'en';

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
    provideAppInitializer(() => firstValueFrom(inject(TranslocoService).load(DEFAULT_LOCALE))),
  ]);
}
