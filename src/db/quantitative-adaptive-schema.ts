//File : /src/db/quantitative-adaptive-schema.ts

import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, unique } from 'drizzle-orm/pg-core';
import { quantSubtopics, quantTestAttempts, quantQuestions } from './quantitative-schema';

/**
 * Table: userQuantAdaptiveSettings
 * Purpose: Store user-specific settings for the quantitative adaptive learning system
 */
export const userQuantAdaptiveSettings = pgTable('userQuantAdaptiveSettings', {
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
 * Table: quantLearningGaps
 * Purpose: Track identified knowledge gaps in quantitative reasoning for targeted remediation
 */
export const quantLearningGaps = pgTable('quantLearningGaps', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    subtopicId: integer('subtopic_id').notNull().references(() => quantSubtopics.id),
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
 * Table: quantAdaptiveQuestionSelection
 * Purpose: Log which questions were selected and why in quantitative adaptive sessions
 */
export const quantAdaptiveQuestionSelection = pgTable('quantAdaptiveQuestionSelection', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').notNull().references(() => quantTestAttempts.id),
    questionId: integer('question_id').notNull().references(() => quantQuestions.id),
    selectionReason: text('selection_reason').notNull(), // e.g., 'gap', 'progression', 'difficulty'
    difficultyLevel: integer('difficulty_level').notNull(),
    sequencePosition: integer('sequence_position').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const userQuantAdaptiveSettingsRelations = relations(userQuantAdaptiveSettings, ({ }) => ({}));

export const quantLearningGapsRelations = relations(quantLearningGaps, ({ one }) => ({
    subtopic: one(quantSubtopics, {
        fields: [quantLearningGaps.subtopicId],
        references: [quantSubtopics.id]
    })
}));

export const quantAdaptiveQuestionSelectionRelations = relations(quantAdaptiveQuestionSelection, ({ one }) => ({
    session: one(quantTestAttempts, {
        fields: [quantAdaptiveQuestionSelection.sessionId],
        references: [quantTestAttempts.id]
    }),
    question: one(quantQuestions, {
        fields: [quantAdaptiveQuestionSelection.questionId],
        references: [quantQuestions.id]
    })
}));

// Types
export type UserQuantAdaptiveSettings = typeof userQuantAdaptiveSettings.$inferSelect;
export type NewUserQuantAdaptiveSettings = typeof userQuantAdaptiveSettings.$inferInsert;

export type QuantLearningGap = typeof quantLearningGaps.$inferSelect;
export type NewQuantLearningGap = typeof quantLearningGaps.$inferInsert;

export type QuantAdaptiveQuestionSelection = typeof quantAdaptiveQuestionSelection.$inferSelect;
export type NewQuantAdaptiveQuestionSelection = typeof quantAdaptiveQuestionSelection.$inferInsert;