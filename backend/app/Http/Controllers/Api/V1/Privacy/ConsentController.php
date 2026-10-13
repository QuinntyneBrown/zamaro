<?php

namespace App\Http\Controllers\Api\V1\Privacy;

use App\Actions\Privacy\AcceptCurrentTerms;
use App\Actions\Privacy\LegalDocumentOutdated;
use App\Actions\Privacy\RecordConsent;
use App\Enums\ConsentKind;
use App\Enums\ConsentSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Privacy\AcceptTermsRequest;
use App\Http\Requests\Privacy\MarketingChoiceRequest;
use App\Http\Resources\Accounts\CurrentUserResource;
use App\Models\ConsentRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Consent after registration (L2-080.3, L2-080.4, privacy/record-consent). */
class ConsentController extends Controller
{
    /**
     * Accept the current terms.
     *
     * Records the version the page showed; the answer is the person, no longer stopped.
     *
     * @throws LegalDocumentOutdated 409 when the version shown is no longer current
     */
    public function acceptTerms(AcceptTermsRequest $request, AcceptCurrentTerms $accept): CurrentUserResource
    {
        $accept->handle($request->user(), $request->validated('termsVersion'), $request);

        return new CurrentUserResource($request->user()->load('roles'));
    }

    /**
     * The marketing choice.
     *
     * The latest marketing record: whether the person wants emails about new artists near their church.
     */
    public function marketing(Request $request): JsonResponse
    {
        return $this->choice((bool) ConsentRecord::where('user_id', $request->user()->id)
            ->where('kind', ConsentKind::MarketingEmail)
            ->orderByDesc('recorded_at')
            ->orderByDesc('id')
            ->value('granted'));
    }

    /**
     * Change the marketing choice.
     *
     * Appends a record with source `settings`; the earlier ones stay (L2-080.4).
     */
    public function saveMarketing(MarketingChoiceRequest $request, RecordConsent $record): JsonResponse
    {
        $granted = $request->boolean('granted');
        DB::transaction(fn () => $record->handle($request->user(), [[ConsentKind::MarketingEmail, null, $granted]], ConsentSource::Settings, $request));

        return $this->choice($granted);
    }

    private function choice(bool $granted): JsonResponse
    {
        return response()->json(['data' => ['granted' => $granted]]);
    }
}
