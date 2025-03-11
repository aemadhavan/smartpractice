CREATE TABLE "mathQuestionAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"user_answer" text,
	"is_correct" boolean DEFAULT false NOT NULL,
	"time_spent" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mathQuestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"subtopic_id" integer NOT NULL,
	"question_type_id" integer NOT NULL,
	"difficulty_level_id" integer NOT NULL,
	"question" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text NOT NULL,
	"formula" text,
	"time_allocation" integer DEFAULT 60 NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mathRealWorldApplications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mathRealWorldApplications_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "mathSubtopicApplications" (
	"id" serial PRIMARY KEY NOT NULL,
	"subtopic_id" integer NOT NULL,
	"application_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mathSubtopicApplications_subtopic_id_application_id_unique" UNIQUE("subtopic_id","application_id")
);
--> statement-breakpoint
CREATE TABLE "mathSubtopicProgress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subtopic_id" integer NOT NULL,
	"mastery_level" integer DEFAULT 0 NOT NULL,
	"questions_attempted" integer DEFAULT 0 NOT NULL,
	"questions_correct" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mathSubtopicProgress_user_id_subtopic_id_unique" UNIQUE("user_id","subtopic_id")
);
--> statement-breakpoint
CREATE TABLE "mathSubtopics" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mathSubtopics_topic_id_name_unique" UNIQUE("topic_id","name")
);
--> statement-breakpoint
CREATE TABLE "mathTestAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subtopic_id" integer NOT NULL,
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
CREATE TABLE "mathTestCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"time_allocation" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mathTestCategories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "mathTestCategoryTopics" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_category_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mathTestCategoryTopics_test_category_id_topic_id_unique" UNIQUE("test_category_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "mathTopicProgress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"topic_id" integer NOT NULL,
	"mastery_level" integer DEFAULT 0 NOT NULL,
	"questions_attempted" integer DEFAULT 0 NOT NULL,
	"questions_correct" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mathTopicProgress_user_id_topic_id_unique" UNIQUE("user_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "mathTopics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "mathTopics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "mathQuestionAttempts" ADD CONSTRAINT "mathQuestionAttempts_test_attempt_id_mathTestAttempts_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."mathTestAttempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathQuestionAttempts" ADD CONSTRAINT "mathQuestionAttempts_question_id_mathQuestions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."mathQuestions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathQuestions" ADD CONSTRAINT "mathQuestions_topic_id_mathTopics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."mathTopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathQuestions" ADD CONSTRAINT "mathQuestions_subtopic_id_mathSubtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."mathSubtopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathQuestions" ADD CONSTRAINT "mathQuestions_question_type_id_questionType_id_fk" FOREIGN KEY ("question_type_id") REFERENCES "public"."questionType"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathQuestions" ADD CONSTRAINT "mathQuestions_difficulty_level_id_difficultyLevels_id_fk" FOREIGN KEY ("difficulty_level_id") REFERENCES "public"."difficultyLevels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathSubtopicApplications" ADD CONSTRAINT "mathSubtopicApplications_subtopic_id_mathSubtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."mathSubtopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathSubtopicApplications" ADD CONSTRAINT "mathSubtopicApplications_application_id_mathRealWorldApplications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."mathRealWorldApplications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathSubtopicProgress" ADD CONSTRAINT "mathSubtopicProgress_subtopic_id_mathSubtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."mathSubtopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathSubtopics" ADD CONSTRAINT "mathSubtopics_topic_id_mathTopics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."mathTopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathTestAttempts" ADD CONSTRAINT "mathTestAttempts_subtopic_id_mathSubtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."mathSubtopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathTestCategoryTopics" ADD CONSTRAINT "mathTestCategoryTopics_test_category_id_mathTestCategories_id_fk" FOREIGN KEY ("test_category_id") REFERENCES "public"."mathTestCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathTestCategoryTopics" ADD CONSTRAINT "mathTestCategoryTopics_topic_id_mathTopics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."mathTopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mathTopicProgress" ADD CONSTRAINT "mathTopicProgress_topic_id_mathTopics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."mathTopics"("id") ON DELETE no action ON UPDATE no action;