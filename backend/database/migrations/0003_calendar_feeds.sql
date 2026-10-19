CREATE TABLE "calendar_feeds" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"artist_id" bigint NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"token_encrypted" text NOT NULL,
	"enabled_at" timestamp with time zone NOT NULL,
	"regenerated_at" timestamp with time zone,
	CONSTRAINT "calendar_feeds_artistId_unique" UNIQUE("artist_id"),
	CONSTRAINT "calendar_feeds_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "calendar_feeds" ADD CONSTRAINT "calendar_feeds_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;