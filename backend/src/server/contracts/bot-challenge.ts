/**
 * Checks a bot challenge token with the provider (L2-077.4). The vendor is chosen in M10; until then
 * the fake is bound (ADR-0002, M2 D2).
 */
export interface BotChallenge {
  /**
   * Whether the single-use token proves a person submitted the form `action` from `ip`.
   *
   * @throws BotChallengeUnavailable when the provider cannot be reached
   */
  passes(token: string, ip: string | null, action: string): Promise<boolean>;
}

/** The bot challenge provider did not answer; the form is refused, as if the check failed (M2 D3). */
export class BotChallengeUnavailable extends Error {
  constructor(message = 'The bot challenge provider did not answer.') {
    super(message);
    this.name = 'BotChallengeUnavailable';
  }
}
