CREATE TABLE "userStreaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "userStreaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vocabularyAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vocabulary_id" integer NOT NULL,
	"step_type" text NOT NULL,
	"is_successful" boolean DEFAULT false NOT NULL,
	"response" text,
	"time_spent" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabularyProgress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vocabulary_id" integer NOT NULL,
	"mastery_level" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp DEFAULT now() NOT NULL,
	"step_completion" jsonb DEFAULT '{"definition":false,"usage":false,"synonym":false,"antonym":false}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vocabularyAttempts" ADD CONSTRAINT "vocabularyAttempts_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabularyProgress" ADD CONSTRAINT "vocabularyProgress_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE no action ON UPDATE no action;