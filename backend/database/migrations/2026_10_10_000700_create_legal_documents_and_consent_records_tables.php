<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Each published version of the terms and the privacy policy (privacy/record-consent). The
        // current one is the latest whose effective date has come.
        Schema::create('legal_documents', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 20);
            // The year and month it takes effect: "2026-10".
            $table->string('version', 7);
            $table->date('effective_from');
            $table->string('url');
            $table->jsonb('summary_of_changes')->default('[]');
            $table->timestamps();

            $table->unique(['kind', 'version']);
            $table->index(['kind', 'effective_from']);
        });

        // What each person agreed to and when, as CASL evidence (L2-080). RecordConsent is its only
        // writer; a change of mind is a new row.
        Schema::create('consent_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 20);
            // Null for the marketing choice.
            $table->string('document_version', 7)->nullable();
            $table->boolean('granted');
            $table->timestampTz('recorded_at');
            $table->string('source', 20);
            $table->ipAddress()->nullable();
            $table->string('user_agent', 512)->nullable();

            $table->index(['user_id', 'kind', 'recorded_at']);
        });

        // Records never change while the account exists; deleting the account (M9) removes them.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION consent_records_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                RAISE EXCEPTION 'consent records are append-only';
            END;
            $$;
            CREATE TRIGGER consent_records_append_only BEFORE UPDATE ON consent_records
                FOR EACH ROW EXECUTE FUNCTION consent_records_append_only();
            CREATE TRIGGER consent_records_no_delete BEFORE DELETE ON consent_records
                FOR EACH ROW WHEN (pg_trigger_depth() = 0) EXECUTE FUNCTION consent_records_append_only();
            SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('consent_records');
        Schema::dropIfExists('legal_documents');
        DB::unprepared('DROP FUNCTION IF EXISTS consent_records_append_only()');
    }
};
