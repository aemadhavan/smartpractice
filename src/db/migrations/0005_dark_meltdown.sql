CREATE TABLE "categoryStatus" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categoryStatus_user_id_category_id_unique" UNIQUE("user_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "categoryStatus" ADD CONSTRAINT "categoryStatus_category_id_alphabetCategories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."alphabetCategories"("id") ON DELETE no action ON UPDATE no action;