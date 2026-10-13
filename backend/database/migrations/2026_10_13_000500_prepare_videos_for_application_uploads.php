<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An applicant's videos arrive before any account or artist exists (apply-as-artist, ADR-0026):
     * the upload has no user, the video no artist, and a token ties it to the later submission.
     * `artist_application_id` gets its foreign key with the applications table (M3 S11).
     */
    public function up(): void
    {
        Schema::table('uploads', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });
        Schema::table('artist_videos', function (Blueprint $table) {
            $table->foreignId('artist_id')->nullable()->change();
            $table->unsignedBigInteger('artist_application_id')->nullable()->index();
            $table->string('upload_token', 64)->nullable()->unique();
            $table->uuid('upload_id')->nullable();
            $table->string('file_name')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->unsignedBigInteger('uploaded_bytes')->default(0);
            $table->string('original_key')->nullable();
            $table->string('failure_reason')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('artist_videos', function (Blueprint $table) {
            $table->dropColumn(['artist_application_id', 'upload_token', 'upload_id', 'file_name', 'size_bytes', 'uploaded_bytes', 'original_key', 'failure_reason']);
        });
    }
};
