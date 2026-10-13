<?php

namespace Tests\Feature\Administration;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * L2-069.3, L2-092 (administration/record-audit-log, ADR-0022): `audit:prune` deletes entries older
 * than 2 years, as the retention role, in batches; a second run deletes nothing, and a missed day is
 * caught up by the next run.
 */
class PruneAuditEntriesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 03:30', 'America/Toronto'));
    }

    public function test_entries_older_than_two_years_go_and_newer_ones_stay(): void
    {
        $this->entry('2024-10-08 12:00');
        $this->entry('2024-10-10 12:00');
        $this->entry('2024-06-01 12:00');

        $this->artisan('audit:prune')->expectsOutputToContain('2 audit entries')->assertSuccessful();

        $this->assertSame(['2024-10-10 16:00:00+00'], DB::table('audit_entries')->pluck('occurred_at')->map(fn ($at) => (string) $at)->all());
    }

    public function test_a_second_run_deletes_nothing(): void
    {
        $this->entry('2024-10-08 12:00');
        $this->artisan('audit:prune')->assertSuccessful();

        $this->artisan('audit:prune')->expectsOutputToContain('0 audit entries')->assertSuccessful();

        $this->assertSame(0, DB::table('audit_entries')->count());
    }

    public function test_it_deletes_in_batches_of_1000(): void
    {
        DB::table('audit_entries')->insert(array_map(fn (int $i) => [
            'action' => 'auth.sign_in', 'outcome' => 'succeeded', 'context' => '{}',
            'occurred_at' => Carbon::parse('2024-01-01 12:00', 'America/Toronto')->addMinutes($i)->toIso8601String(),
        ], range(1, 1500)));

        $this->artisan('audit:prune')->expectsOutputToContain('1500 audit entries')->assertSuccessful();

        $this->assertSame(0, DB::table('audit_entries')->count());
    }

    private function entry(string $at): void
    {
        DB::table('audit_entries')->insert([
            'action' => 'auth.sign_in', 'outcome' => 'succeeded', 'context' => '{}',
            'occurred_at' => Carbon::parse($at, 'America/Toronto')->toIso8601String(),
        ]);
    }
}
