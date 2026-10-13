<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The order saves were made in, so two saves in the same instant still list newest first
        // (accounts/view-saved-artists). Additive: existing rows are numbered as they stand.
        Schema::table('saved_artists', function (Blueprint $table) {
            $table->id();
        });
    }

    public function down(): void
    {
        Schema::table('saved_artists', function (Blueprint $table) {
            $table->dropColumn('id');
        });
    }
};
