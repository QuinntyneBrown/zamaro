<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Single-use reset links (accounts/sign-in-and-recover-access). Only the token's SHA-256 is
        // stored; the link works for 60 minutes.
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->timestampTz('expires_at');
            $table->timestampTz('used_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('user_id');
        });

        // Every signed-in session, so a reset or a changed password can end the others. The key is the
        // SHA-256 of the session ID; the ID itself is kept only encrypted, to destroy the session.
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->char('id', 64)->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('encrypted_session_id');
            $table->string('device_label')->nullable();
            $table->string('approximate_city')->nullable();
            $table->ipAddress()->nullable();
            $table->timestampTz('last_active_at');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
        Schema::dropIfExists('password_reset_tokens');
    }
};
