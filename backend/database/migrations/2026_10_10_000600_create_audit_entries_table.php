<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The append-only audit log (administration/record-audit-log, M2 D22). RecordAuditEntry is
        // its only writer; the viewer and retention arrive with M3.
        Schema::create('audit_entries', function (Blueprint $table) {
            $table->id();
            // No foreign key: an entry outlives the account it names until retention removes it.
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_role', 20)->nullable();
            $table->string('action', 64);
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->timestampTz('occurred_at')->useCurrent();
            $table->ipAddress()->nullable();
            $table->string('outcome', 10);
            $table->jsonb('context')->default('{}');

            $table->index('occurred_at');
            $table->index(['actor_id', 'occurred_at']);
            $table->index(['target_type', 'target_id']);
            $table->index('action');
        });

        // Entries never change. M3 lets the retention role delete expired ones.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION audit_entries_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                RAISE EXCEPTION 'audit entries are append-only';
            END;
            $$;
            CREATE TRIGGER audit_entries_append_only BEFORE UPDATE OR DELETE ON audit_entries
                FOR EACH ROW EXECUTE FUNCTION audit_entries_append_only();
            SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_entries');
        DB::unprepared('DROP FUNCTION IF EXISTS audit_entries_append_only()');
    }
};
