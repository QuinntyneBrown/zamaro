CREATE TYPE "public"."act_type" AS ENUM('solo', 'duo', 'band', 'choir');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."artist_status" AS ENUM('approved', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."audit_outcome" AS ENUM('succeeded', 'failed', 'denied');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('requested', 'accepted', 'confirmed', 'completed', 'declined', 'withdrawn', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."consent_kind" AS ENUM('terms', 'privacy-policy', 'marketing-email');--> statement-breakpoint
CREATE TYPE "public"."consent_source" AS ENUM('registration', 'terms-update', 'settings');--> statement-breakpoint
CREATE TYPE "public"."gathering_kind" AS ENUM('sunday-service', 'worship-night', 'youth-event', 'conference-or-retreat', 'wedding', 'funeral-or-memorial');--> statement-breakpoint
CREATE TYPE "public"."musical_key" AS ENUM('C', 'D-flat', 'D', 'E-flat', 'E', 'F', 'F-sharp', 'G', 'A-flat', 'A', 'B-flat', 'B', 'C-minor', 'C-sharp-minor', 'D-minor', 'E-flat-minor', 'E-minor', 'F-minor', 'F-sharp-minor', 'G-minor', 'G-sharp-minor', 'A-minor', 'B-flat-minor', 'B-minor', 'any');--> statement-breakpoint
CREATE TYPE "public"."override_state" AS ENUM('free', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."pronoun" AS ENUM('she', 'he', 'they');--> statement-breakpoint
CREATE TYPE "public"."style" AS ENUM('band', 'solo-vocalist', 'gospel-choir', 'acoustic', 'hymns', 'spanish');--> statement-breakpoint
CREATE TYPE "public"."theme_preference" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TYPE "public"."upload_purpose" AS ENUM('vsc_document', 'photo', 'video', 'caption');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('quarantined', 'clean', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('uploading', 'processing', 'live', 'failed');--> statement-breakpoint
CREATE TYPE "public"."vsc_status" AS ENUM('scanning', 'pending', 'verified', 'blocked');--> statement-breakpoint
CREATE TABLE "churches" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"booker_id" bigint NOT NULL,
	"name" varchar(120) NOT NULL,
	"street_address" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"province" char(2) DEFAULT 'ON' NOT NULL,
	"postal_code" varchar(7) NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"phone" text NOT NULL,
	"denomination" varchar(255),
	"typical_attendance" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "churches_bookerId_unique" UNIQUE("booker_id")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"kind" "consent_kind" NOT NULL,
	"document_version" varchar(7),
	"granted" boolean NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"source" "consent_source" NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(512)
);
--> statement-breakpoint
CREATE TABLE "email_change_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token_hash" char(64) NOT NULL,
	"new_email" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_change_tokens_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token_hash" char(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" "consent_kind" NOT NULL,
	"version" varchar(7) NOT NULL,
	"effective_from" date NOT NULL,
	"url" varchar(255) NOT NULL,
	"summary_of_changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_documents_kind_version_unique" UNIQUE("kind","version")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token_hash" char(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "recovery_codes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"code_hash" char(64) NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_user" (
	"user_id" bigint NOT NULL,
	"role_id" bigint NOT NULL,
	CONSTRAINT "role_user_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(20) NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" char(64) PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"encrypted_session_id" text NOT NULL,
	"device_label" varchar(255),
	"approximate_city" varchar(255),
	"ip_address" varchar(45),
	"last_active_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"password" varchar(255) NOT NULL,
	"pending_email" varchar(255),
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"two_factor_confirmed_at" timestamp with time zone,
	"first_saved_at" timestamp with time zone,
	"theme_preference" "theme_preference",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "artist_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" bigint NOT NULL,
	"position" smallint NOT NULL,
	"alt_text" varchar(150) NOT NULL,
	"renditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_ratings" (
	"artist_id" bigint PRIMARY KEY NOT NULL,
	"rating" numeric(2, 1),
	"review_count" integer DEFAULT 0 NOT NULL,
	"recalculated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "artist_styles" (
	"artist_id" bigint NOT NULL,
	"style" "style" NOT NULL,
	CONSTRAINT "artist_styles_artist_id_style_pk" PRIMARY KEY("artist_id","style")
);
--> statement-breakpoint
CREATE TABLE "artist_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" bigint,
	"artist_application_id" bigint,
	"position" smallint NOT NULL,
	"title" varchar(100) NOT NULL,
	"status" "video_status" NOT NULL,
	"manifest_key" varchar(255),
	"poster_key" varchar(255),
	"captions_key" varchar(255),
	"duration_seconds" integer,
	"upload_token" varchar(64),
	"upload_id" uuid,
	"file_name" varchar(255),
	"size_bytes" bigint,
	"uploaded_bytes" bigint DEFAULT 0 NOT NULL,
	"original_key" varchar(255),
	"failure_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artist_videos_uploadToken_unique" UNIQUE("upload_token")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"slug" varchar(255) NOT NULL,
	"ticket_number" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"act_type" "act_type" NOT NULL,
	"base_city" varchar(255) NOT NULL,
	"base_latitude" numeric(9, 6) NOT NULL,
	"base_longitude" numeric(9, 6) NOT NULL,
	"max_drive_km" smallint NOT NULL,
	"from_price_cents" integer NOT NULL,
	"status" "artist_status" NOT NULL,
	"payout_ready" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"pronoun" "pronoun" DEFAULT 'they' NOT NULL,
	"headline" varchar(80) DEFAULT '' NOT NULL,
	"about_heading" varchar(80),
	"bio" text,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contact_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artists_userId_unique" UNIQUE("user_id"),
	CONSTRAINT "artists_slug_unique" UNIQUE("slug"),
	CONSTRAINT "artists_ticketNumber_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "availability_overrides" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"artist_id" bigint NOT NULL,
	"date" date NOT NULL,
	"state" "override_state" NOT NULL,
	"note" varchar(100),
	CONSTRAINT "availability_overrides_artistId_date_unique" UNIQUE("artist_id","date")
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"artist_id" bigint NOT NULL,
	"weekday" smallint NOT NULL,
	"unavailable" boolean NOT NULL,
	CONSTRAINT "availability_rules_artistId_weekday_unique" UNIQUE("artist_id","weekday")
);
--> statement-breakpoint
CREATE TABLE "saved_artists" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"artist_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_artists_userId_artistId_unique" UNIQUE("user_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "setlist_songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" bigint NOT NULL,
	"position" smallint NOT NULL,
	"title" varchar(100) NOT NULL,
	"writer" varchar(100),
	"key" "musical_key" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "setlist_songs_position_range" CHECK ("setlist_songs"."position" BETWEEN 1 AND 50)
);
--> statement-breakpoint
CREATE TABLE "slug_histories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"artist_id" bigint NOT NULL,
	"slug" varchar(255) NOT NULL,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slug_histories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "booking_transitions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"booking_id" bigint NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status" NOT NULL,
	"actor_kind" varchar(255) NOT NULL,
	"actor_id" bigint,
	"reason" varchar(255),
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"number" varchar(255) NOT NULL,
	"artist_id" bigint NOT NULL,
	"status" "booking_status" NOT NULL,
	"event_date" date NOT NULL,
	"kind" "gathering_kind" NOT NULL,
	"church_name" varchar(255) NOT NULL,
	"church_city" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "review_replies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"review_id" bigint NOT NULL,
	"artist_id" bigint NOT NULL,
	"text" varchar(500) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"edited_at" timestamp with time zone,
	CONSTRAINT "review_replies_reviewId_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"booking_id" bigint NOT NULL,
	"artist_id" bigint NOT NULL,
	"booker_id" bigint NOT NULL,
	"stars" smallint NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"edited_at" timestamp with time zone,
	"hidden_at" timestamp with time zone,
	"hidden_reason" varchar(255),
	"hidden_by" bigint,
	CONSTRAINT "reviews_bookingId_unique" UNIQUE("booking_id"),
	CONSTRAINT "reviews_stars_range" CHECK ("reviews"."stars" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "application_references" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"artist_application_id" bigint NOT NULL,
	"name" varchar(100) NOT NULL,
	"church" varchar(120) NOT NULL,
	"phone" text,
	"email" text,
	"verified_at" timestamp with time zone,
	"verified_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_applications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"number" varchar(12) NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"act_type" "act_type" NOT NULL,
	"base_city" varchar(255) NOT NULL,
	"base_latitude" numeric(9, 6) NOT NULL,
	"base_longitude" numeric(9, 6) NOT NULL,
	"styles" jsonb NOT NULL,
	"bio" text NOT NULL,
	"from_price_cents" integer NOT NULL,
	"max_drive_km" smallint NOT NULL,
	"status" "application_status" NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" bigint,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artist_applications_number_unique" UNIQUE("number"),
	CONSTRAINT "artist_applications_idempotencyKey_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint,
	"purpose" "upload_purpose" NOT NULL,
	"detected_mime" varchar(100) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"quarantine_key" varchar(255),
	"object_key" varchar(255),
	"status" "upload_status" NOT NULL,
	"rejection_reason" varchar(32),
	"scanner_signature" varchar(255),
	"scanned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vulnerable_sector_checks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"issued_on" date NOT NULL,
	"expires_on" date,
	"status" "vsc_status" NOT NULL,
	"verified_at" timestamp with time zone,
	"upload_id" uuid,
	"storage_key" varchar(255),
	"wrapped_data_key" text,
	"mime_type" varchar(100),
	"size_bytes" bigint,
	"verified_by" bigint,
	"renewal_reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" bigint,
	"actor_role" varchar(20),
	"action" varchar(64) NOT NULL,
	"target_type" varchar(255),
	"target_id" bigint,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"outcome" "audit_outcome" NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "churches" ADD CONSTRAINT "churches_booker_id_users_id_fk" FOREIGN KEY ("booker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_change_tokens" ADD CONSTRAINT "email_change_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_codes" ADD CONSTRAINT "recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_user" ADD CONSTRAINT "role_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_user" ADD CONSTRAINT "role_user_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_photos" ADD CONSTRAINT "artist_photos_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_ratings" ADD CONSTRAINT "artist_ratings_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_styles" ADD CONSTRAINT "artist_styles_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_videos" ADD CONSTRAINT "artist_videos_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_videos" ADD CONSTRAINT "artist_videos_artist_application_id_artist_applications_id_fk" FOREIGN KEY ("artist_application_id") REFERENCES "public"."artist_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_overrides" ADD CONSTRAINT "availability_overrides_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_artists" ADD CONSTRAINT "saved_artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_artists" ADD CONSTRAINT "saved_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setlist_songs" ADD CONSTRAINT "setlist_songs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slug_histories" ADD CONSTRAINT "slug_histories_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_transitions" ADD CONSTRAINT "booking_transitions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_transitions" ADD CONSTRAINT "booking_transitions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booker_id_users_id_fk" FOREIGN KEY ("booker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hidden_by_users_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_references" ADD CONSTRAINT "application_references_artist_application_id_artist_applications_id_fk" FOREIGN KEY ("artist_application_id") REFERENCES "public"."artist_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_references" ADD CONSTRAINT "application_references_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_applications" ADD CONSTRAINT "artist_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_applications" ADD CONSTRAINT "artist_applications_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vulnerable_sector_checks" ADD CONSTRAINT "vulnerable_sector_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vulnerable_sector_checks" ADD CONSTRAINT "vulnerable_sector_checks_upload_id_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vulnerable_sector_checks" ADD CONSTRAINT "vulnerable_sector_checks_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_records_user_id_kind_recorded_at_index" ON "consent_records" USING btree ("user_id","kind","recorded_at");--> statement-breakpoint
CREATE INDEX "email_change_tokens_user_id_index" ON "email_change_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_id_index" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "legal_documents_kind_effective_from_index" ON "legal_documents" USING btree ("kind","effective_from");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_index" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recovery_codes_user_id_code_hash_index" ON "recovery_codes" USING btree ("user_id","code_hash");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_index" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "artist_styles_style_artist_id_index" ON "artist_styles" USING btree ("style","artist_id");--> statement-breakpoint
CREATE INDEX "artist_videos_artist_application_id_index" ON "artist_videos" USING btree ("artist_application_id");--> statement-breakpoint
CREATE INDEX "artists_status_base_latitude_base_longitude_index" ON "artists" USING btree ("status","base_latitude","base_longitude");--> statement-breakpoint
CREATE INDEX "saved_artists_user_id_created_at_index" ON "saved_artists" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "booking_transitions_to_status_occurred_at_index" ON "booking_transitions" USING btree ("to_status","occurred_at");--> statement-breakpoint
CREATE INDEX "bookings_artist_id_event_date_index" ON "bookings" USING btree ("artist_id","event_date");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_one_confirmed_per_date" ON "bookings" USING btree ("artist_id","event_date") WHERE "bookings"."status" = 'confirmed';--> statement-breakpoint
CREATE INDEX "reviews_visible_newest" ON "reviews" USING btree ("artist_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "reviews"."hidden_at" IS NULL;--> statement-breakpoint
CREATE INDEX "artist_applications_status_submitted_at_index" ON "artist_applications" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "artist_applications_one_pending_per_email" ON "artist_applications" USING btree (lower("email")) WHERE "artist_applications"."status" = 'submitted';--> statement-breakpoint
CREATE INDEX "uploads_user_id_purpose_index" ON "uploads" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "uploads_status_index" ON "uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vulnerable_sector_checks_status_expires_on_index" ON "vulnerable_sector_checks" USING btree ("status","expires_on");--> statement-breakpoint
CREATE INDEX "audit_entries_occurred_at_index" ON "audit_entries" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_entries_actor_id_occurred_at_index" ON "audit_entries" USING btree ("actor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_entries_target_type_target_id_index" ON "audit_entries" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_entries_action_index" ON "audit_entries" USING btree ("action");