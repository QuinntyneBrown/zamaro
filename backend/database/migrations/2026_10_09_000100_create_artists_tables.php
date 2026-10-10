<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained();
            $table->string('slug')->unique();
            $table->string('ticket_number')->unique();
            $table->string('display_name');
            $table->string('act_type');
            $table->string('base_city');
            $table->decimal('base_latitude', 9, 6);
            $table->decimal('base_longitude', 9, 6);
            $table->unsignedSmallInteger('max_drive_km');
            $table->unsignedInteger('from_price_cents');
            $table->string('status');
            $table->boolean('payout_ready')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            // Search pre-filters visible artists inside a bounding box of the radius.
            $table->index(['status', 'base_latitude', 'base_longitude']);
        });

        Schema::create('artist_styles', function (Blueprint $table) {
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->string('style');
            $table->primary(['artist_id', 'style']);
            $table->index(['style', 'artist_id']);
        });

        Schema::create('artist_ratings', function (Blueprint $table) {
            $table->foreignId('artist_id')->primary()->constrained()->cascadeOnDelete();
            $table->decimal('rating', 2, 1)->nullable();
            $table->unsignedInteger('review_count')->default(0);
            $table->timestamp('recalculated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artist_ratings');
        Schema::dropIfExists('artist_styles');
        Schema::dropIfExists('artists');
    }
};
