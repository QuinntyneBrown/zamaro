<?php

namespace App\Actions\Privacy;

use App\Enums\ConsentKind;
use App\Enums\ConsentSource;
use App\Models\User;
use App\Services\Privacy\LegalDocumentRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Accepting the current terms (L2-080.3): the version the page showed must still be current, so the
 * record holds the version the person saw; otherwise 409 `legal-document-outdated` and nothing is
 * written. Recorded with source `terms-update`.
 */
class AcceptCurrentTerms
{
    public function __construct(private readonly LegalDocumentRegistry $documents, private readonly RecordConsent $record) {}

    /**
     * @throws LegalDocumentOutdated
     */
    public function handle(User $user, string $termsVersion, Request $request): void
    {
        if ($this->documents->current(ConsentKind::Terms)->version !== $termsVersion) {
            throw new LegalDocumentOutdated;
        }

        DB::transaction(fn () => $this->record->handle($user, [[ConsentKind::Terms, $termsVersion, true]], ConsentSource::TermsUpdate, $request));
    }
}
