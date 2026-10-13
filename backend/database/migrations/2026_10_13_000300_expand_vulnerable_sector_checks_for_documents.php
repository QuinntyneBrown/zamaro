<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The document columns of a check (verify-vulnerable-sector-check): the upload it came from, where
     * its ciphertext lives, its wrapped data key, type and size, who verified it and when the renewal
     * reminder went. A check waiting for the scan or verification has no expiry yet. Expand only.
     */
    public function up(): void
    {
        Schema::table('vulnerable_sector_checks', function (Blueprint $table) {
            $table->date('expires_on')->nullable()->change();
            $table->foreignUuid('upload_id')->nullable()->constrained('uploads');
            $table->string('storage_key')->nullable();
            $table->text('wrapped_data_key')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->timestampTz('renewal_reminder_sent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('vulnerable_sector_checks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('upload_id');
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn(['storage_key', 'wrapped_data_key', 'mime_type', 'size_bytes', 'renewal_reminder_sent_at']);
        });
    }
};
