import type { NextRequest } from 'next/server';
import { BotChallengeUnavailable } from '@/server/contracts/bot-challenge';
import { botChallenge } from '@/server/integrations/bindings';
import { logger } from '@/server/support/logger';
import { ValidationProblem } from '@/server/support/problems';
import { clientAddress } from './client-address';

/**
 * The forms that send email to whatever address is typed check `challengeToken` before validation
 * or any write (L2-077.4). A missing or failed token, or a provider that does not answer (M2 D3),
 * gets the same 422 on `challengeToken`.
 */
export const BOT_CHALLENGE_MESSAGE =
  'We couldn’t check that you’re a person. Try again; if it keeps happening, email hello@zamaro.ca.';

export async function assertBotChallengePassed(
  body: unknown,
  request: NextRequest,
  action: string,
): Promise<void> {
  const token = tokenOf(body);
  let passed = false;
  try {
    passed = token !== '' && (await botChallenge().passes(token, clientAddress(request), action));
  } catch (error) {
    if (!(error instanceof BotChallengeUnavailable)) throw error;
    logger().error({ err: error, action }, 'bot challenge provider unavailable');
  }
  if (!passed) throw new ValidationProblem({ challengeToken: [BOT_CHALLENGE_MESSAGE] });
}

function tokenOf(body: unknown): string {
  if (body === null || typeof body !== 'object') return '';
  const token = (body as Record<string, unknown>).challengeToken;
  return typeof token === 'string' ? token : '';
}
