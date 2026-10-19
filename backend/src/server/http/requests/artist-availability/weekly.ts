import { z } from 'zod';

const WEEKDAYS = 'Pick weekdays from Monday to Sunday.';

/** The weekly default: any combination of ISO weekdays, including none (L2-056.2). */
export const SetWeeklyAvailabilityRequest = z.object({
  unavailableWeekdays: z
    .array(z.unknown(), { error: WEEKDAYS })
    .refine(
      (days): days is number[] =>
        days.every((day) => Number.isInteger(day) && (day as number) >= 1 && (day as number) <= 7),
      WEEKDAYS,
    )
    .refine((days) => new Set(days).size === days.length, WEEKDAYS),
});
