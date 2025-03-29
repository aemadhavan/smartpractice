-- Add indexes to optimize adaptive maths question retrieval

-- Index for finding active questions by subtopic
CREATE INDEX IF NOT EXISTS "idx_mathQuestions_subtopic_active" ON "mathQuestions" ("subtopic_id", "is_active");

-- Index for finding test attempts by user and subtopic
CREATE INDEX IF NOT EXISTS "idx_mathTestAttempts_user_subtopic" ON "mathTestAttempts" ("user_id", "subtopic_id");

-- Index for finding question attempts by test attempt ID
CREATE INDEX IF NOT EXISTS "idx_mathQuestionAttempts_testAttempt" ON "mathQuestionAttempts" ("test_attempt_id");

-- Index for finding question attempts by question ID
CREATE INDEX IF NOT EXISTS "idx_mathQuestionAttempts_question" ON "mathQuestionAttempts" ("question_id");
