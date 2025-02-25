CREATE TABLE "quantQuestionAttempts" (
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
CREATE TABLE "quantQuestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"subtopic_id" integer NOT NULL,
	"question_type_id" integer NOT NULL,
	"difficulty_level_id" integer NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
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
CREATE TABLE "quantSubtopicProgress" (
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
	CONSTRAINT "quantSubtopicProgress_user_id_subtopic_id_unique" UNIQUE("user_id","subtopic_id")
);
--> statement-breakpoint
CREATE TABLE "quantSubtopics" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "quantSubtopics_topic_id_name_unique" UNIQUE("topic_id","name")
);
--> statement-breakpoint
CREATE TABLE "quantTestAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"test_category_id" integer NOT NULL,
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
CREATE TABLE "quantTestCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"time_allocation" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "quantTestCategories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "quantTestCategoryTopics" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_category_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "quantTestCategoryTopics_test_category_id_topic_id_unique" UNIQUE("test_category_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "quantTopicProgress" (
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
	CONSTRAINT "quantTopicProgress_user_id_topic_id_unique" UNIQUE("user_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "quantTopics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "quantTopics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "quantQuestionAttempts" ADD CONSTRAINT "quantQuestionAttempts_test_attempt_id_quantTestAttempts_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."quantTestAttempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantQuestionAttempts" ADD CONSTRAINT "quantQuestionAttempts_question_id_quantQuestions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quantQuestions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantQuestions" ADD CONSTRAINT "quantQuestions_topic_id_quantTopics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."quantTopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantQuestions" ADD CONSTRAINT "quantQuestions_subtopic_id_quantSubtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."quantSubtopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantQuestions" ADD CONSTRAINT "quantQuestions_question_type_id_questionType_id_fk" FOREIGN KEY ("question_type_id") REFERENCES "public"."questionType"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantQuestions" ADD CONSTRAINT "quantQuestions_difficulty_level_id_difficultyLevels_id_fk" FOREIGN KEY ("difficulty_level_id") REFERENCES "public"."difficultyLevels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantSubtopicProgress" ADD CONSTRAINT "quantSubtopicProgress_subtopic_id_quantSubtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."quantSubtopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantSubtopics" ADD CONSTRAINT "quantSubtopics_topic_id_quantTopics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."quantTopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantTestAttempts" ADD CONSTRAINT "quantTestAttempts_test_category_id_quantTestCategories_id_fk" FOREIGN KEY ("test_category_id") REFERENCES "public"."quantTestCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantTestCategoryTopics" ADD CONSTRAINT "quantTestCategoryTopics_test_category_id_quantTestCategories_id_fk" FOREIGN KEY ("test_category_id") REFERENCES "public"."quantTestCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantTestCategoryTopics" ADD CONSTRAINT "quantTestCategoryTopics_topic_id_quantTopics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."quantTopics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantTopicProgress" ADD CONSTRAINT "quantTopicProgress_topic_id_quantTopics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."quantTopics"("id") ON DELETE no action ON UPDATE no action;