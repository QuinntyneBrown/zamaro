/**
 * Road distance in whole kilometres and drive time rounded to 5 minutes (L2-002). Approximate when
 * it was estimated from the straight line because routing was unavailable.
 */
export interface Distance {
  km: number;
  driveMinutes: number;
  approximate: boolean;
}

export function distanceFromRoute(metres: number, seconds: number, approximate = false): Distance {
  return {
    km: Math.round(metres / 1000),
    driveMinutes: Math.round(seconds / 60 / 5) * 5,
    approximate,
  };
}
