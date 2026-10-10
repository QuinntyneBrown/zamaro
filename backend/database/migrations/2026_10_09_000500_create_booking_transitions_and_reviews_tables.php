<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Every status change of a booking; the headliner counts transitions to Confirmed (L2-006).
        Schema::create('booking_transitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->string('actor_kind');
            $table->foreignId('actor_id')->nullable()->constrained('users');
            $table->string('reason')->nullable();
            $table->timestamp('occurred_at');

            $table->index(['to_status', 'occurred_at']);
        });

        // One review per booking; hidden by moderation when hidden_at is set (L2-060, L2-062).
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained();
            $table->foreignId('artist_id')->constrained();
            $table->foreignId('booker_id')->constrained('users');
            $table->unsignedSmallInteger('stars');
            $table->text('text');
            $table->timestamp('created_at');
            $table->timestamp('edited_at')->nullable();
            $table->timestamp('hidden_at')->nullable();
            $table->string('hidden_reason')->nullable();
            $table->foreignId('hidden_by')->nullable()->constrained('users');
        });
        DB::statement('ALTER TABLE reviews ADD CONSTRAINT reviews_stars_range CHECK (stars BETWEEN 1 AND 5)');
        DB::statement('CREATE INDEX reviews_visible_newest ON reviews (artist_id, created_at DESC, id DESC) WHERE hidden_at IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('booking_transitions');
    }
};
