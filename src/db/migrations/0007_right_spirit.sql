ALTER TABLE "vocabulary" ADD COLUMN "definition" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD COLUMN "synonyms" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD COLUMN "antonyms" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD COLUMN "part_of_speech" text NOT NULL;