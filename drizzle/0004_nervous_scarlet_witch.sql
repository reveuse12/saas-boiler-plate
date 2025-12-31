CREATE TABLE "admin_setup_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "super_admins" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_setup_tokens" ADD CONSTRAINT "admin_setup_tokens_admin_id_super_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."super_admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_setup_tokens_token_idx" ON "admin_setup_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "admin_setup_tokens_admin_idx" ON "admin_setup_tokens" USING btree ("admin_id");