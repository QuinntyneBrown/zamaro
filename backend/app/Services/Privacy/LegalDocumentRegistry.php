<?php

namespace App\Services\Privacy;

use App\Actions\Privacy\LegalDocumentOutdated;
use App\Enums\ConsentKind;
use App\Models\LegalDocument;

/**
 * The current version of each legal document: the latest whose effective date has come
 * (privacy/record-consent). Two indexed rows, read on demand rather than cached, so a newly
 * effective version applies at once.
 */
class LegalDocumentRegistry
{
    public function current(ConsentKind $kind): LegalDocument
    {
        return LegalDocument::where('kind', $kind)
            ->where('effective_from', '<=', now()->toDateString())
            ->orderByDesc('effective_from')
            ->firstOrFail();
    }

    /**
     * The versions a form showed must still be current, so the version stored is the one the person saw.
     *
     * @throws LegalDocumentOutdated
     */
    public function assertCurrent(string $termsVersion, string $privacyPolicyVersion): void
    {
        if ($this->current(ConsentKind::Terms)->version !== $termsVersion
            || $this->current(ConsentKind::PrivacyPolicy)->version !== $privacyPolicyVersion) {
            throw new LegalDocumentOutdated;
        }
    }
}
