<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The profile's photos (L2-015) and videos (L2-014). Keys name files on the media disk; the
     * upload columns (originals, upload and processor IDs, sizes) arrive with uploads in M4.
     */
    public function up(): void
    {
        Schema::create('artist_photos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->boolean('is_primary')->default(false);
            $table->string('alt_text', 150);
            $table->string('status')->default('processing');
            // [{width, height, format, key}], one per rendition (L2-051.1).
            $table->jsonb('renditions')->default('[]');
            $table->unsignedInteger('width');
            $table->unsignedInteger('height');
            $table->timestamps();
            $table->unique(['artist_id', 'position']);
        });
        DB::statement('CREATE UNIQUE INDEX artist_photos_one_primary ON artist_photos (artist_id) WHERE is_primary');

        Schema::create('artist_videos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('title', 100);
            $table->string('status')->default('processing');
            $table->string('failure_reason')->nullable();
            $table->string('manifest_key')->nullable();
            // [{width, height, format, key}] of the poster frame, like a photo's renditions.
            $table->jsonb('poster_renditions')->default('[]');
            $table->string('captions_key')->nullable();
            $table->string('captions_language', 8)->nullable();
            $table->unsignedSmallInteger('duration_seconds')->nullable();
            $table->timestamps();
            $table->unique(['artist_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artist_videos');
        Schema::dropIfExists('artist_photos');
    }
};
