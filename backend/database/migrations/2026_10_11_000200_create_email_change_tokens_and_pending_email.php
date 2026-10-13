<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A new address asked for and not yet proven (L2-025.1); the account email stays until it is.
        Schema::table('users', function (Blueprint $table) {
            $table->string('pending_email')->nullable();
        });

        // Single-use email change links (accounts/manage-account-settings): only the token's SHA-256 is
        // stored, and the link works for 24 hours (M2 D11).
        Schema::create('email_change_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->string('new_email');
            $table->timestampTz('expires_at');
            $table->timestampTz('used_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_change_tokens');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pending_email');
        });
    }
};
