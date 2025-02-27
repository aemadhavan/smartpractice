ALTER TABLE "quantTestAttempts" DROP CONSTRAINT "quantTestAttempts_test_category_id_quantTestCategories_id_fk";
--> statement-breakpoint
ALTER TABLE "quantTestAttempts" ADD COLUMN "subtopic_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "quantTestAttempts" ADD CONSTRAINT "quantTestAttempts_subtopic_id_quantSubtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."quantSubtopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantTestAttempts" DROP COLUMN "test_category_id";