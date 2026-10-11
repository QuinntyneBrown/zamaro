<?php

namespace App\Http\Middleware;

use App\Actions\Privacy\TermsAcceptanceRequired;
use App\Services\Privacy\LegalDocumentRegistry;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * L2-080.3: a signed-in person who has not accepted the current terms gets the 409
 * `terms-acceptance-required` problem from every signed-in route but these, until they accept
 * (privacy/record-consent).
 */
class EnsureCurrentTermsAccepted
{
    /** Who is signed in, signing out, and accepting the terms. */
    public const OPEN = ['me.show', 'session.destroy', 'account.consents.terms'];

    public function __construct(private readonly LegalDocumentRegistry $documents) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user !== null && ! in_array($request->route()?->getName(), self::OPEN, true)
            && $this->documents->termsAcceptanceRequired($user)) {
            throw new TermsAcceptanceRequired;
        }

        return $next($request);
    }
}
