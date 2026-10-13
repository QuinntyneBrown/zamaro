<?php

namespace App\Http\Middleware;

use App\Contracts\BotChallenge;
use App\Contracts\BotChallengeUnavailable;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * `bot-challenge:{action}` on the forms that send email to whatever address is typed (L2-077.4).
 * Before validation or any write, `challengeToken` must pass; a missing or failed token, or a provider
 * that does not answer (M2 D3), gets the same 422 on `challengeToken`.
 */
class VerifyBotChallenge
{
    public const MESSAGE = 'We couldn’t check that you’re a person. Try again; if it keeps happening, email hello@zamaro.ca.';

    public function __construct(private readonly BotChallenge $challenge) {}

    public function handle(Request $request, Closure $next, string $action): Response
    {
        $token = $request->input('challengeToken');

        try {
            $passed = is_string($token) && $token !== '' && $this->challenge->passes($token, $request->ip(), $action);
        } catch (BotChallengeUnavailable $e) {
            report($e);
            $passed = false;
        }

        if (! $passed) {
            throw ValidationException::withMessages(['challengeToken' => self::MESSAGE]);
        }

        return $next($request);
    }
}
