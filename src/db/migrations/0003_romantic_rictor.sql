CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"answer" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"sequence_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionTopics" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "correct_answer_id" integer;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "solution_explanation" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "marks" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "time_allocation" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionTopics" ADD CONSTRAINT "questionTopics_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionTopics" ADD CONSTRAINT "questionTopics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;