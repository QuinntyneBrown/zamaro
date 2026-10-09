<?php

namespace App\Services\Operations\Readiness;

use Illuminate\Support\Facades\DB;

class DatabaseCheck implements HealthCheck
{
    public function name(): string
    {
        return 'database';
    }

    public function check(): void
    {
        DB::connection()->select('SELECT 1');
    }
}
