CREATE TABLE "quantAdaptiveQuestionSelection" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"selection_reason" text NOT NULL,
	"difficulty_level" integer NOT NULL,
	"sequence_position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quantLearningGaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subtopic_id" integer NOT NULL,
	"concept_description" text,
	"severity" integer DEFAULT 5 NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"evidence_question_ids" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userQuantAdaptiveSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"adaptivity_level" integer DEFAULT 5 NOT NULL,
	"difficulty_preference" text DEFAULT 'balanced' NOT NULL,
	"enable_adaptive_learning" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userQuantAdaptiveSettings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "quantAdaptiveQuestionSelection" ADD CONSTRAINT "quantAdaptiveQuestionSelection_session_id_quantTestAttempts_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quantTestAttempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantAdaptiveQuestionSelection" ADD CONSTRAINT "quantAdaptiveQuestionSelection_question_id_quantQuestions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quantQuestions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantLearningGaps" ADD CONSTRAINT "quantLearningGaps_subtopic_id_quantSubtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."quantSubtopics"("id") ON DELETE no action ON UPDATE no action;