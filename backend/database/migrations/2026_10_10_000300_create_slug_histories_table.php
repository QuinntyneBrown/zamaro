<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Every slug an artist has held (ADR-0011): the current one has no retired_at. The unique
        // index keeps a retired slug from ever reaching another artist (L2-055.3).
        Schema::create('slug_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained();
            $table->string('slug')->unique();
            $table->timestamp('retired_at')->nullable();
            $table->timestamps();
        });

        DB::statement('INSERT INTO slug_histories (artist_id, slug, created_at, updated_at) SELECT id, slug, now(), now() FROM artists');
    }

    public function down(): void
    {
        Schema::dropIfExists('slug_histories');
    }
};
