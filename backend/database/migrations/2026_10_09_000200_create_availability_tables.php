<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Weekly defaults: ISO weekday 1 (Monday) to 7 (Sunday).
        Schema::create('availability_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('weekday');
            $table->boolean('unavailable');
            $table->unique(['artist_id', 'weekday']);
        });

        // Dated exceptions; a Free override beats the weekly rule.
        Schema::create('availability_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('state');
            $table->string('note', 100)->nullable();
            $table->unique(['artist_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availability_overrides');
        Schema::dropIfExists('availability_rules');
    }
};
