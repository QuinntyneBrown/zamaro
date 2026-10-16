import { z } from 'zod';

/** Which unfinished features this environment has turned on (ADR-0012). */
export const FeaturesResource = z.object({
  data: z.object({
    /** Sending booking requests from the profile's booking stub (bookings/send-booking-request). */
    bookingRequests: z.boolean(),
  }),
});

export type FeaturesResource = z.infer<typeof FeaturesResource>;
