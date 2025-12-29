CREATE TYPE "public"."super_admin_role" AS ENUM('primary_admin', 'admin');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_activity_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"admin_email" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "super_admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "super_admin_role" DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "is_suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_super_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."super_admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_sessions_token_idx" ON "admin_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_idx" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "audit_logs_admin_idx" ON "audit_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "super_admins_email_idx" ON "super_admins" USING btree ("email");