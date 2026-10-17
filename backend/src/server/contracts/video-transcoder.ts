/** Where a transcode landed on the media disk, and how long the video runs. */
export interface TranscodeResult {
  manifestKey: string;
  posterKey: string;
  durationSeconds: number;
}

/**
 * The video processing service (L2-052.1, ADR-0002): reads a video's length and turns a clean
 * original into adaptive streaming renditions with a poster frame. The vendor is chosen in M10; until
 * then the fake answers from the file's bytes and writes the sample stream.
 */
export interface VideoTranscoder {
  /** How long the video runs, in seconds, from its bytes. */
  probe(bytes: Buffer): Promise<number>;
  /**
   * Transcodes the original at `originalKey` on the originals disk into renditions under
   * `outputPrefix` on the media disk, and answers where the manifest and poster landed.
   */
  transcode(originalKey: string, outputPrefix: string): Promise<TranscodeResult>;
}
