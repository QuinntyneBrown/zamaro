import type { ScanVerdict } from '@/server/enums';

/** The scanner's answer: the verdict and, for malware, the signature it matched. */
export interface ScanResult {
  verdict: ScanVerdict;
  signature?: string;
}

/**
 * The malware scanner every upload passes before it leaves quarantine (L2-076.1, ADR-0002). The
 * vendor is chosen in M10; until then the fake decides by content.
 */
export interface MediaScanner {
  scan(bytes: Buffer): Promise<ScanResult>;
}
