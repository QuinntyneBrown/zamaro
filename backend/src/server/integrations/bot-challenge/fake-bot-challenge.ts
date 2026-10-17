import { type BotChallenge, BotChallengeUnavailable } from '@/server/contracts/bot-challenge';

/**
 * Deterministic bot challenge for development and tests (ADR-0002): every token passes except
 * `fail`. `unreachable` stands in for a provider that does not answer (M2 D3).
 */
export class FakeBotChallenge implements BotChallenge {
  static readonly FAILING_TOKEN = 'fail';

  constructor(private readonly unreachable = false) {}

  passes(token: string): Promise<boolean> {
    if (this.unreachable) {
      return Promise.reject(
        new BotChallengeUnavailable('The fake bot challenge provider is set to be unreachable.'),
      );
    }
    return Promise.resolve(token !== FakeBotChallenge.FAILING_TOKEN);
  }
}
