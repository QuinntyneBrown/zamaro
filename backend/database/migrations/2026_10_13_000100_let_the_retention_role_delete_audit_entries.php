<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The retention role (administration/record-audit-log): `audit:prune` switches to it to delete
     * entries 2 years old. The trigger still refuses every UPDATE, and every DELETE from any other role.
     * Roles belong to the cluster, so the role is created once and kept by `down`.
     */
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'zamaro_audit_retention') THEN
                    CREATE ROLE zamaro_audit_retention NOLOGIN;
                END IF;
            END
            $$;
            GRANT SELECT, DELETE ON audit_entries TO zamaro_audit_retention;
            CREATE OR REPLACE FUNCTION audit_entries_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'DELETE' AND current_user = 'zamaro_audit_retention' THEN
                    RETURN OLD;
                END IF;
                RAISE EXCEPTION 'audit entries are append-only';
            END;
            $$;
            SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION audit_entries_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                RAISE EXCEPTION 'audit entries are append-only';
            END;
            $$;
            REVOKE SELECT, DELETE ON audit_entries FROM zamaro_audit_retention;
            SQL);
    }
};
