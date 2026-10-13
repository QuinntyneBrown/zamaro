<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every file anyone uploads passes through here (security/scan-and-serve-uploads): quarantined
     * until the scan, then clean under a random object name, or rejected and deleted.
     */
    public function up(): void
    {
        Schema::create('uploads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained();
            $table->string('purpose', 32);
            $table->string('detected_mime', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->string('quarantine_key')->nullable();
            $table->string('object_key')->nullable();
            $table->string('status', 16);
            $table->string('rejection_reason', 32)->nullable();
            $table->string('scanner_signature')->nullable();
            $table->timestampTz('scanned_at')->nullable();
            $table->timestampsTz();
            $table->index(['user_id', 'purpose']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uploads');
    }
};
