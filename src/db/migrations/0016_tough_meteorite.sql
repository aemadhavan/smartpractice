ALTER TABLE "adaptiveQuestionSelection" RENAME COLUMN "session_id" TO "test_attempt_id";--> statement-breakpoint
ALTER TABLE "adaptiveQuestionSelection" DROP CONSTRAINT "adaptiveQuestionSelection_session_id_mathTestAttempts_id_fk";
--> statement-breakpoint
ALTER TABLE "adaptiveQuestionSelection" ADD CONSTRAINT "adaptiveQuestionSelection_test_attempt_id_mathTestAttempts_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."mathTestAttempts"("id") ON DELETE no action ON UPDATE no action;