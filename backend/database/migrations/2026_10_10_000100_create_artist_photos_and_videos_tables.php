<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The profile's photos (L2-015) and videos (L2-014). Columns follow the upload designs
     * (artist-workspace/upload-photos, upload-videos); the upload-only columns (primary photo,
     * sources, sessions, failure reasons) arrive with uploads in M4. Keys are paths on the media disk.
     */
    public function up(): void
    {
        Schema::create('artist_photos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('alt_text', 150);
            // [{width, format, key}] for the 400, 800, 1200 and 1600 px widths in AVIF and WebP (L2-051).
            $table->jsonb('renditions')->default('[]');
            $table->unsignedInteger('width');
            $table->unsignedInteger('height');
            $table->timestamps();
        });
        DB::statement('ALTER TABLE artist_photos ADD CONSTRAINT artist_photos_artist_position UNIQUE (artist_id, position) DEFERRABLE INITIALLY DEFERRED');

        Schema::create('artist_videos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('title', 100);
            $table->string('status');
            $table->string('manifest_key')->nullable();
            $table->string('poster_key')->nullable();
            $table->string('captions_key')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestamps();
        });
        DB::statement('ALTER TABLE artist_videos ADD CONSTRAINT artist_videos_artist_position UNIQUE (artist_id, position) DEFERRABLE INITIALLY DEFERRED');
    }

    public function down(): void
    {
        Schema::dropIfExists('artist_videos');
        Schema::dropIfExists('artist_photos');
    }
};
