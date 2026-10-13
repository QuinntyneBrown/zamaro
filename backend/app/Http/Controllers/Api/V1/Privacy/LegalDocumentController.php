<?php

namespace App\Http\Controllers\Api\V1\Privacy;

use App\Enums\ConsentKind;
use App\Http\Controllers\Controller;
use App\Http\Resources\Privacy\LegalDocumentResource;
use App\Services\Privacy\LegalDocumentRegistry;

class LegalDocumentController extends Controller
{
    /**
     * The current terms of use and privacy policy.
     *
     * The sign-up form sends back the versions it showed (L2-080.1).
     */
    public function current(LegalDocumentRegistry $registry): array
    {
        return [
            'data' => [
                'terms' => new LegalDocumentResource($registry->current(ConsentKind::Terms)),
                'privacyPolicy' => new LegalDocumentResource($registry->current(ConsentKind::PrivacyPolicy)),
            ],
        ];
    }
}
