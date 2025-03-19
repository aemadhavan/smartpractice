CREATE TABLE "mathTestFeedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_attempt_id" integer NOT NULL,
	"feedback" text NOT NULL,
	"strengths" text,
	"areas_to_improve" text,
	"suggested_topics" text,
	"percentage_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mathTestFeedback" ADD CONSTRAINT "mathTestFeedback_test_attempt_id_mathTestAttempts_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."mathTestAttempts"("id") ON DELETE no action ON UPDATE no action;