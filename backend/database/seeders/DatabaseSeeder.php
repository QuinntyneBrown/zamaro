<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Idempotent: safe to run again on a seeded database.
     */
    public function run(): void
    {
        $this->call(CastSeeder::class);
    }
}
