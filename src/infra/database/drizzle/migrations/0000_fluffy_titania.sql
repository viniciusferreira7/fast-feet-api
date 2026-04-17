CREATE TYPE "public"."package_status" AS ENUM('pending', 'awaiting_pickup', 'picked_up', 'at_distribution_center', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'DELIVERY', 'RECIPIENT');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	CONSTRAINT "attachments_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "delivery_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"validated_at" timestamp with time zone,
	CONSTRAINT "email_codes_id_unique" UNIQUE("id"),
	CONSTRAINT "email_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" varchar(600) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"recipient_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" varchar(600),
	"from_status" "package_status",
	"to_status" "package_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"delivery_id" uuid,
	"author_id" uuid NOT NULL,
	"package_id" uuid
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"status" "package_status" NOT NULL,
	"name" text NOT NULL,
	"postal_code" text NOT NULL,
	"recipient_address" text NOT NULL,
	"attachment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"recipient_id" uuid NOT NULL,
	"delivery_id" uuid,
	"author_id" uuid NOT NULL,
	CONSTRAINT "packages_code_unique" UNIQUE("code"),
	CONSTRAINT "packages_attachment_id_unique" UNIQUE("attachment_id")
);
--> statement-breakpoint
CREATE TABLE "recipient_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cpf" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"email_code" uuid,
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "cpf_numeric_check" CHECK ("users"."cpf" ~ '^[0-9]{11}$')
);
--> statement-breakpoint
ALTER TABLE "delivery_profiles" ADD CONSTRAINT "delivery_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_histories" ADD CONSTRAINT "package_histories_delivery_id_users_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_histories" ADD CONSTRAINT "package_histories_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_histories" ADD CONSTRAINT "package_histories_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_attachment_id_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_delivery_id_users_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_profiles" ADD CONSTRAINT "recipient_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_code_email_codes_id_fk" FOREIGN KEY ("email_code") REFERENCES "public"."email_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_profile_is_active_idx" ON "delivery_profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notification_recipient_id_idx" ON "notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "notification_recipient_unread_idx" ON "notifications" USING btree ("recipient_id","read_at");--> statement-breakpoint
CREATE INDEX "package_history_package_id_idx" ON "package_histories" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "package_history_delivery_id_idx" ON "package_histories" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "package_recipient_id_idx" ON "packages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "package_delivery_id_idx" ON "packages" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "package_status_idx" ON "packages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "role_idx" ON "users" USING btree ("role");