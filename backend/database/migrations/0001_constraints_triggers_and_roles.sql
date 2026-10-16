-- Hand-written SQL Drizzle cannot express (ADR-0027): the closed set of roles, deferrable position
-- constraints, the append-only audit and consent tables, and the audit retention role.

INSERT INTO roles (name) VALUES ('booker'), ('artist'), ('admin') ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Reordering swaps positions inside one transaction, so uniqueness is checked at commit.
ALTER TABLE setlist_songs ADD CONSTRAINT setlist_songs_artist_position UNIQUE (artist_id, position) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE artist_photos ADD CONSTRAINT artist_photos_artist_position UNIQUE (artist_id, position) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE artist_videos ADD CONSTRAINT artist_videos_artist_position UNIQUE (artist_id, position) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint

-- Audit entries never change (ADR-0022). The retention role (audit:prune) may delete expired ones;
-- roles belong to the cluster, so it is created once. Every other UPDATE or DELETE is refused.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'zamaro_audit_retention') THEN
        CREATE ROLE zamaro_audit_retention NOLOGIN;
    END IF;
END
$$;
--> statement-breakpoint
GRANT SELECT, DELETE ON audit_entries TO zamaro_audit_retention;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION audit_entries_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' AND current_user = 'zamaro_audit_retention' THEN
        RETURN OLD;
    END IF;
    RAISE EXCEPTION 'audit entries are append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_entries_append_only BEFORE UPDATE OR DELETE ON audit_entries
    FOR EACH ROW EXECUTE FUNCTION audit_entries_append_only();
--> statement-breakpoint

-- Consent records never change while the account exists; deleting the account removes them (cascade).
CREATE OR REPLACE FUNCTION consent_records_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'consent records are append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER consent_records_append_only BEFORE UPDATE ON consent_records
    FOR EACH ROW EXECUTE FUNCTION consent_records_append_only();
--> statement-breakpoint
CREATE TRIGGER consent_records_no_delete BEFORE DELETE ON consent_records
    FOR EACH ROW WHEN (pg_trigger_depth() = 0) EXECUTE FUNCTION consent_records_append_only();
