<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An applicant's submitted details and references (apply-as-artist, L2-047). One pending
     * application per email is enforced by a partial unique index on the lower-cased address, so a
     * concurrent duplicate fails at the database as well as in the action. Numbers (A-0217, …) count
     * up from the last one under an advisory lock, so they never skip.
     */
    public function up(): void
    {
        Schema::create('artist_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number', 12)->unique();
            $table->string('name', 100);
            $table->string('email');
            $table->string('act_type', 16);
            $table->string('base_city');
            $table->decimal('base_latitude', 9, 6);
            $table->decimal('base_longitude', 9, 6);
            $table->json('styles');
            $table->text('bio');
            $table->unsignedInteger('from_price_cents');
            $table->unsignedSmallInteger('max_drive_km');
            $table->string('status', 16);
            $table->uuid('idempotency_key')->unique();
            $table->timestampTz('submitted_at');
            $table->timestampTz('decided_at')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->timestampsTz();
            $table->index(['status', 'submitted_at']);
        });
        DB::statement("CREATE UNIQUE INDEX artist_applications_one_pending_per_email ON artist_applications (lower(email)) WHERE status = 'submitted'");

        Schema::create('application_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_application_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('church', 120);
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->timestampTz('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
        });

        Schema::table('artist_videos', function (Blueprint $table) {
            $table->foreign('artist_application_id')->references('id')->on('artist_applications')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('artist_videos', function (Blueprint $table) {
            $table->dropForeign(['artist_application_id']);
        });
        Schema::dropIfExists('application_references');
        Schema::dropIfExists('artist_applications');
    }
};
