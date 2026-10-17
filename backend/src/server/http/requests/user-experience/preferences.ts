import { z } from 'zod';
import { ThemePreference, valuesOf } from '@/server/enums';

export const UpdatePreferencesRequest = z.object({
  /** The theme chosen with the toggle: light or dark; null follows the device again. */
  themePreference: z
    .enum(valuesOf(ThemePreference), { error: 'Choose light or dark.' })
    .nullable()
    .optional(),
});
