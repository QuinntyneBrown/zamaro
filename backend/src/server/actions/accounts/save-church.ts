import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { churches } from '@/server/db/schema';
import type { SaveChurchRequest } from '@/server/http/requests/accounts/settings';
import type { ChurchRow } from '@/server/http/resources/accounts/church';
import { geocoder } from '@/server/integrations/bindings';
import { serviceAreaContains } from '@/server/services/discovery/service-area';
import { now } from '@/server/support/clock';
import { encryptField } from '@/server/support/encryption/field-cipher';
import { toE164 } from '@/server/support/phone';
import { ValidationProblem } from '@/server/support/problems';
import { squish } from '@/server/support/strings';

/**
 * Saves a booker's one church (L2-024, L2-001): the address is geocoded and must be within 200 km of
 * Toronto by road before anything is written. Bookings keep their own snapshot of the address, so
 * this never changes them.
 *
 * @throws ValidationProblem on `streetAddress` when the address cannot be found, or on `serviceArea`
 *   when it is outside the service area
 */
export async function saveChurch(bookerId: number, church: SaveChurchRequest): Promise<ChurchRow> {
  const streetAddress = squish(church.streetAddress);
  const city = squish(church.city);
  const postalCode = tidyPostalCode(church.postalCode);

  const place = await geocoder().geocode(`${streetAddress}, ${city}, ON ${postalCode}`);
  if (place === null) {
    throw new ValidationProblem({
      streetAddress: ['We couldn’t find that address. Check the street and postal code.'],
    });
  }
  if (!(await serviceAreaContains(place.point))) {
    throw new ValidationProblem({
      serviceArea: ['Zamaro serves churches within 200 km of Toronto.'],
    });
  }

  const values = {
    name: squish(church.name),
    streetAddress,
    city,
    province: 'ON',
    postalCode,
    latitude: place.point.latitude,
    longitude: place.point.longitude,
    phone: encryptField(toE164(church.phone) ?? ''),
    denomination:
      church.denomination === null ||
      church.denomination === undefined ||
      church.denomination === ''
        ? null
        : squish(church.denomination),
    typicalAttendance: church.typicalAttendance ?? null,
    updatedAt: now().toJSDate(),
  };
  const [saved] = await db()
    .insert(churches)
    .values({ bookerId, ...values })
    .onConflictDoUpdate({ target: churches.bookerId, set: values })
    .returning();
  if (saved === undefined) throw new Error('The church could not be saved.');
  return saved;
}

export async function churchOf(bookerId: number): Promise<ChurchRow | null> {
  const [church] = await db().select().from(churches).where(eq(churches.bookerId, bookerId));
  return church ?? null;
}

/** "L7R 1A3" from "l7r1a3". */
function tidyPostalCode(value: string): string {
  const compact = value.replace(/\s/g, '').toUpperCase();
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}
