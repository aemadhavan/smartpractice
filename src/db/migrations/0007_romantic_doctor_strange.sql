CREATE TABLE "verbalQuestionAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"user_answer" text,
	"is_correct" boolean,
	"time_spent" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verbalQuestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"question_type_id" integer NOT NULL,
	"vocabulary_id" integer,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text NOT NULL,
	"difficulty_level_id" integer NOT NULL,
	"time_allocation" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verbalTestAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"score" integer,
	"total_questions" integer NOT NULL,
	"correct_answers" integer,
	"time_spent" integer,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verbalTestCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"time_allocation" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "verbalTestCategories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "verbalQuestionAttempts" ADD CONSTRAINT "verbalQuestionAttempts_test_attempt_id_verbalTestAttempts_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."verbalTestAttempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verbalQuestionAttempts" ADD CONSTRAINT "verbalQuestionAttempts_question_id_verbalQuestions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."verbalQuestions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verbalQuestions" ADD CONSTRAINT "verbalQuestions_category_id_verbalTestCategories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."verbalTestCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verbalQuestions" ADD CONSTRAINT "verbalQuestions_question_type_id_questionType_id_fk" FOREIGN KEY ("question_type_id") REFERENCES "public"."questionType"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verbalQuestions" ADD CONSTRAINT "verbalQuestions_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verbalQuestions" ADD CONSTRAINT "verbalQuestions_difficulty_level_id_difficultyLevels_id_fk" FOREIGN KEY ("difficulty_level_id") REFERENCES "public"."difficultyLevels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verbalTestAttempts" ADD CONSTRAINT "verbalTestAttempts_category_id_verbalTestCategories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."verbalTestCategories"("id") ON DELETE no action ON UPDATE no action;