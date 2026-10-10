<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The artist's one public reply to a review, shown beneath it (L2-018.3, L2-061).
        Schema::create('review_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('artist_id')->constrained();
            $table->string('text', 500);
            $table->timestamp('created_at');
            $table->timestamp('edited_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_replies');
    }
};
