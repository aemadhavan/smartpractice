CREATE TABLE "alphabet_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"letter" char(1) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "alphabet_categories_letter_unique" UNIQUE("letter")
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"id" serial PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"category_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_category_id_alphabet_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."alphabet_categories"("id") ON DELETE no action ON UPDATE no action;