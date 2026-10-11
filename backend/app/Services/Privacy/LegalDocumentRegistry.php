<?php

namespace App\Services\Privacy;

use App\Actions\Privacy\LegalDocumentOutdated;
use App\Enums\ConsentKind;
use App\Models\ConsentRecord;
use App\Models\LegalDocument;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * The current version of each legal document: the latest whose effective date has come
 * (privacy/record-consent). Two indexed rows, read on demand rather than cached, so a newly
 * effective version applies at once.
 */
class LegalDocumentRegistry
{
    public function current(ConsentKind $kind): LegalDocument
    {
        return $this->currentOrNull($kind) ?? throw (new ModelNotFoundException)->setModel(LegalDocument::class);
    }

    public function currentOrNull(ConsentKind $kind): ?LegalDocument
    {
        return LegalDocument::where('kind', $kind)
            ->where('effective_from', '<=', now()->toDateString())
            ->orderByDesc('effective_from')
            ->first();
    }

    /**
     * Whether the person must accept the current terms first (L2-080.3): their latest granted terms
     * record is not the current version. A new privacy policy alone asks nothing (M2 D15), and with no
     * terms published there is nothing to accept.
     */
    public function termsAcceptanceRequired(User $user): bool
    {
        $current = $this->currentOrNull(ConsentKind::Terms);
        if ($current === null) {
            return false;
        }
        $accepted = ConsentRecord::where('user_id', $user->id)
            ->where('kind', ConsentKind::Terms)
            ->where('granted', true)
            ->orderByDesc('recorded_at')
            ->orderByDesc('id')
            ->value('document_version');

        return $accepted !== $current->version;
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
