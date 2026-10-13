import { Injectable, InjectionToken } from '@angular/core';
import { type Observable, of } from 'rxjs';

/** The forms that send email to whatever address is typed (L2-077.4). */
export type BotChallengeAction = 'register' | 'forgot-password' | 'artist-application';

/**
 * The privacy-respecting bot check (security/limit-request-rates). It runs when a form is submitted
 * and yields a single-use token for `challengeToken`; ask again after any failed submission.
 */
export interface BotChallenge {
  token(action: BotChallengeAction): Observable<string>;
}

export const BOT_CHALLENGE = new InjectionToken<BotChallenge>('BotChallenge');

/**
 * Stands in for the provider's widget until its vendor is chosen (M10, M2 D2): every check passes,
 * and the API's fake accepts the token.
 */
@Injectable()
export class FakeBotChallenge implements BotChallenge {
  token(): Observable<string> {
    return of('pass');
  }
}
