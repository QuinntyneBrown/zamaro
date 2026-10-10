<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The public profile's text (L2-012, L2-013) and setlist (L2-016). Plain text only; the editor
     * that writes them arrives with the artist workspace (M4).
     */
    public function up(): void
    {
        Schema::table('artists', function (Blueprint $table) {
            $table->string('pronoun')->default('they');
            $table->string('headline', 80)->default('');
            $table->string('about_heading', 80)->nullable();
            $table->text('bio')->nullable();
            $table->jsonb('languages')->default('[]');
        });

        Schema::create('setlist_songs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('title', 100);
            $table->string('writer', 100)->nullable();
            $table->string('key');
            $table->timestamps();
        });
        // Reordering swaps positions inside one transaction, so uniqueness is checked at commit.
        DB::statement('ALTER TABLE setlist_songs ADD CONSTRAINT setlist_songs_artist_position UNIQUE (artist_id, position) DEFERRABLE INITIALLY DEFERRED');
        DB::statement('ALTER TABLE setlist_songs ADD CONSTRAINT setlist_songs_position_range CHECK (position BETWEEN 1 AND 50)');
    }

    public function down(): void
    {
        Schema::dropIfExists('setlist_songs');
        Schema::table('artists', function (Blueprint $table) {
            $table->dropColumn(['pronoun', 'headline', 'about_heading', 'bio', 'languages']);
        });
    }
};
