import type { MediaScanner, ScanResult } from '@/server/contracts/media-scanner';
import { ScanVerdict } from '@/server/enums';

/**
 * The scanner's fake (ADR-0002): the EICAR test string is malware, a file carrying
 * `SCANNER-UNAVAILABLE` cannot be scanned (so the job retries), and everything else is clean. The
 * EICAR string is assembled at runtime, never written as one literal, so no antivirus quarantines
 * the source.
 */
export class FakeMediaScanner implements MediaScanner {
  static readonly EICAR = [
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$',
    'EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
  ].join('');
  static readonly UNAVAILABLE = 'SCANNER-UNAVAILABLE';

  scan(bytes: Buffer): Promise<ScanResult> {
    const contents = bytes.toString('latin1');
    if (contents.includes(FakeMediaScanner.UNAVAILABLE)) {
      return Promise.resolve({ verdict: ScanVerdict.Error });
    }
    if (contents.includes(FakeMediaScanner.EICAR)) {
      return Promise.resolve({ verdict: ScanVerdict.Infected, signature: 'EICAR-Test-File' });
    }
    return Promise.resolve({ verdict: ScanVerdict.Clean });
  }
}
