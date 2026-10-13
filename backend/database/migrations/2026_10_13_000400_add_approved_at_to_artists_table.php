<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** When the application was approved (review-artist-application, M3 D19); the admin artist page shows it. Expand only. */
    public function up(): void
    {
        Schema::table('artists', function (Blueprint $table) {
            $table->timestampTz('approved_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('artists', function (Blueprint $table) {
            $table->dropColumn('approved_at');
        });
    }
};
