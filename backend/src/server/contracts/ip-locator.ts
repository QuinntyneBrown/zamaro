/**
 * The approximate city of a network address, for the signed-in devices list (L2-025.3). The source
 * is chosen in M10; until then the fake locator is bound (ADR-0002, M2 D13).
 */
export interface IpLocator {
  /** "Burlington, ON", or null when the address cannot be placed. */
  city(ip: string | null): Promise<string | null>;
}
