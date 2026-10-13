<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A booker's saved artists (accounts/save-artist): one row each, newest first on the list page.
        Schema::create('saved_artists', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['user_id', 'artist_id']);
        });
        DB::statement('CREATE INDEX saved_artists_user_id_created_at_index ON saved_artists (user_id, created_at DESC)');

        // When the booker first saved anyone, so "Saved artists are private" shows once.
        Schema::table('users', function (Blueprint $table) {
            $table->timestampTz('first_saved_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('first_saved_at');
        });
        Schema::dropIfExists('saved_artists');
    }
};
