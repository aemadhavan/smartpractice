// src/db/adaptive-schema.ts

import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, unique } from 'drizzle-orm/pg-core';
import { mathSubtopics, mathTestAttempts, mathQuestions } from './maths-schema';

/**
 * Table: userAdaptiveSettings
 * Purpose: Store user-specific settings for the adaptive learning system
 */
export const userAdaptiveSettings = pgTable('userAdaptiveSettings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  adaptivityLevel: integer('adaptivity_level').notNull().default(5), // 1-10 scale
  difficultyPreference: text('difficulty_preference').notNull().default('balanced'),
  enableAdaptiveLearning: boolean('enable_adaptive_learning').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserId: unique().on(table.userId)
  };
});

/**
 * Table: learningGaps
 * Purpose: Track identified knowledge gaps for targeted remediation
 */
export const learningGaps = pgTable('learningGaps', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  subtopicId: integer('subtopic_id').notNull().references(() => mathSubtopics.id),
  conceptDescription: text('concept_description'),
  severity: integer('severity').notNull().default(5), // 1-10 scale
  detectedAt: timestamp('detected_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
  evidenceQuestionIds: text('evidence_question_ids'), // Comma-separated list of question IDs
  status: text('status').notNull().default('active'), // 'active', 'testing', 'resolved'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Table: adaptiveQuestionSelection
 * Purpose: Log which questions were selected and why in adaptive sessions
 */
export const adaptiveQuestionSelection = pgTable('adaptiveQuestionSelection', {
  id: serial('id').primaryKey(),
  testAttemptId: integer('test_attempt_id').notNull().references(() => mathTestAttempts.id),
  questionId: integer('question_id').notNull().references(() => mathQuestions.id),
  selectionReason: text('selection_reason').notNull(), // e.g., 'gap', 'progression', 'difficulty'
  difficultyLevel: integer('difficulty_level').notNull(),
  sequencePosition: integer('sequence_position').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const userAdaptiveSettingsRelations = relations(userAdaptiveSettings, ({ }) => ({}));

export const learningGapsRelations = relations(learningGaps, ({ one }) => ({
  subtopic: one(mathSubtopics, {
    fields: [learningGaps.subtopicId],
    references: [mathSubtopics.id]
  })
}));

export const adaptiveQuestionSelectionRelations = relations(adaptiveQuestionSelection, ({ one }) => ({
  session: one(mathTestAttempts, {
    fields: [adaptiveQuestionSelection.testAttemptId],
    references: [mathTestAttempts.id]
  }),
  question: one(mathQuestions, {
    fields: [adaptiveQuestionSelection.questionId],
    references: [mathQuestions.id]
  })
}));

// Types
export type UserAdaptiveSettings = typeof userAdaptiveSettings.$inferSelect;
export type NewUserAdaptiveSettings = typeof userAdaptiveSettings.$inferInsert;

export type LearningGap = typeof learningGaps.$inferSelect;
export type NewLearningGap = typeof learningGaps.$inferInsert;

export type AdaptiveQuestionSelection = typeof adaptiveQuestionSelection.$inferSelect;
export type NewAdaptiveQuestionSelection = typeof adaptiveQuestionSelection.$inferInsert;