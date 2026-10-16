const EARTH_RADIUS_KM = 6371;

/** A point in decimal degrees. */
export class Coordinates {
  constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}

  /** Rounded to 4 decimal places (about 11 m), the precision distances are cached at (L2-002). */
  key(): string {
    return `${this.latitude.toFixed(4)},${this.longitude.toFixed(4)}`;
  }

  /** Great-circle (straight-line) distance in kilometres. */
  straightLineKmTo(other: Coordinates): number {
    const lat1 = toRadians(this.latitude);
    const lat2 = toRadians(other.latitude);
    const a =
      Math.sin((lat2 - lat1) / 2) ** 2 +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(toRadians(other.longitude - this.longitude) / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
  }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
