CREATE TABLE "waitlist" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"referral_source" text,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
