<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // TOTP two-step sign-in (L2-072.3): the key is encrypted by the API (ADR-0020) and only counts
        // once a first code confirms it.
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('mfa_enabled')->default(false);
            $table->text('two_factor_secret')->nullable();
            $table->timestampTz('two_factor_confirmed_at')->nullable();
        });

        // Ten single-use codes for a lost phone; only their SHA-256 is stored.
        Schema::create('recovery_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('code_hash', 64);
            $table->timestampTz('used_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['user_id', 'code_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recovery_codes');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['mfa_enabled', 'two_factor_secret', 'two_factor_confirmed_at']);
        });
    }
};
