<?php

namespace Database\Seeders;

use App\Enums\ConsentKind;
use App\Models\LegalDocument;
use Illuminate\Database\Seeder;

/**
 * The published terms and privacy policy (M2 plan, seed data). Terms 2026-10 took effect on
 * Thu 8 Oct 2026 with the three changes the accept-terms mock lists; Tomi last accepted 2026-03.
 * Each terms version has a privacy policy of the same date, so a version is current on every day.
 * Upserted on kind and version, so running it again changes nothing.
 */
class LegalDocumentSeeder extends Seeder
{
    private const DOCUMENTS = [
        [ConsentKind::Terms, '2026-03', '2026-03-01', 'https://zamaro.ca/legal/terms', []],
        [ConsentKind::Terms, '2026-10', '2026-10-08', 'https://zamaro.ca/legal/terms', [
            'How long booking and payment records are kept after an account is deleted: 7 years, for tax, without your name.',
            'Which payment processor holds card details; Zamaro never sees or stores them.',
            'How Zamaro checks artists who lead youth events.',
        ]],
        [ConsentKind::PrivacyPolicy, '2026-03', '2026-03-01', 'https://zamaro.ca/legal/privacy', []],
        [ConsentKind::PrivacyPolicy, '2026-10', '2026-10-08', 'https://zamaro.ca/legal/privacy', []],
    ];

    public function run(): void
    {
        foreach (self::DOCUMENTS as [$kind, $version, $effectiveFrom, $url, $changes]) {
            LegalDocument::updateOrCreate(
                ['kind' => $kind, 'version' => $version],
                ['effective_from' => $effectiveFrom, 'url' => $url, 'summary_of_changes' => $changes],
            );
        }
    }
}
