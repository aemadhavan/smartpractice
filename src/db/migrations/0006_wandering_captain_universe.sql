ALTER TABLE "alphabet_categories" RENAME TO "alphabetCategories";--> statement-breakpoint
ALTER TABLE "alphabetCategories" DROP CONSTRAINT "alphabet_categories_letter_unique";--> statement-breakpoint
ALTER TABLE "vocabulary" DROP CONSTRAINT "vocabulary_category_id_alphabet_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_category_id_alphabetCategories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."alphabetCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alphabetCategories" ADD CONSTRAINT "alphabetCategories_letter_unique" UNIQUE("letter");