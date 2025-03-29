ALTER TABLE "quantAdaptiveQuestionSelection" RENAME COLUMN "session_id" TO "test_attempt_id";--> statement-breakpoint
ALTER TABLE "quantAdaptiveQuestionSelection" DROP CONSTRAINT "quantAdaptiveQuestionSelection_session_id_quantTestAttempts_id_fk";
--> statement-breakpoint
ALTER TABLE "quantAdaptiveQuestionSelection" ADD CONSTRAINT "quantAdaptiveQuestionSelection_test_attempt_id_quantTestAttempts_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."quantTestAttempts"("id") ON DELETE no action ON UPDATE no action;