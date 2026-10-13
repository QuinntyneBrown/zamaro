<?php

namespace App\Actions\Privacy;

use App\Enums\ConsentKind;
use App\Enums\ConsentSource;
use App\Models\ConsentRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Appends one consent record per item, with the time, the address and the browser, as CASL evidence
 * (L2-080, privacy/record-consent). The only writer of `consent_records`; called inside the caller's
 * transaction.
 */
class RecordConsent
{
    /**
     * @param  list<array{ConsentKind, ?string, bool}>  $items  kind, document version (null for marketing), granted
     */
    public function handle(User $user, array $items, ConsentSource $source, Request $request): void
    {
        foreach ($items as [$kind, $version, $granted]) {
            ConsentRecord::create([
                'user_id' => $user->id,
                'kind' => $kind,
                'document_version' => $version,
                'granted' => $granted,
                'recorded_at' => now(),
                'source' => $source,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 512, ''),
            ]);
        }
    }
}
