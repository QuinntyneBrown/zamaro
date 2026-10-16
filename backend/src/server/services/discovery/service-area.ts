import { Coordinates } from './coordinates';
import { distancesFromOrigin } from './distance-service';

/** Every address within 200 km by road of Toronto City Hall (L2-001). */
export const MAX_ROAD_KM = 200;

export function cityHall(): Coordinates {
  return new Coordinates(43.6534, -79.3841);
}

export async function serviceAreaContains(point: Coordinates): Promise<boolean> {
  const [distance] = await distancesFromOrigin(cityHall(), [point]);
  return distance !== undefined && distance.km <= MAX_ROAD_KM;
}
