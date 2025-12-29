CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'member' NOT NULL,
	"tenant_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "todos_tenant_idx" ON "todos" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "todos_user_idx" ON "todos" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_tenant_idx" ON "users" USING btree ("email","tenant_id");--> statement-breakpoint
CREATE INDEX "users_tenant_idx" ON "users" USING btree ("tenant_id");