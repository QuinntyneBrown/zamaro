<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The decision on an application (review-artist-application, M3 S14): the note sent with a rejection,
 * and the artist an approval created. Expand only; nothing existing changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artist_applications', function (Blueprint $table) {
            $table->text('rejection_note')->nullable()->after('rejection_reason');
            $table->foreignId('artist_id')->nullable()->after('rejection_note')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('artist_applications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('artist_id');
            $table->dropColumn('rejection_note');
        });
    }
};
