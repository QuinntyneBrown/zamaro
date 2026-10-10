<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The columns the youth-event rule reads (L2-005.5). Document storage and review columns arrive
     * with verify-vulnerable-sector-check (M3).
     */
    public function up(): void
    {
        Schema::create('vulnerable_sector_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->date('issued_on');
            $table->date('expires_on');
            $table->string('status');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'expires_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vulnerable_sector_checks');
    }
};
