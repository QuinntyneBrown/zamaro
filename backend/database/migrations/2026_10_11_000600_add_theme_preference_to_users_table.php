<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The theme chosen on any signed-in device (user-experience/switch-theme); null follows the device.
        Schema::table('users', function (Blueprint $table) {
            $table->string('theme_preference', 5)->nullable();
        });
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_theme_preference_check CHECK (theme_preference IN ('light', 'dark'))");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('theme_preference');
        });
    }
};
