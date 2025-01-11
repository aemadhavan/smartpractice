CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"difficulty_level_id" integer NOT NULL,
	"question_type_id" integer NOT NULL,
	"question" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_difficulty_level_id_difficultyLevels_id_fk" FOREIGN KEY ("difficulty_level_id") REFERENCES "public"."difficultyLevels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_type_id_questionType_id_fk" FOREIGN KEY ("question_type_id") REFERENCES "public"."questionType"("id") ON DELETE no action ON UPDATE no action;