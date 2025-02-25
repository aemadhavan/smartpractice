// Quantitative Reasoning Schema
import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb, unique } from 'drizzle-orm/pg-core';
import { categories, difficultyLevels, questionType } from './schema'; // Reusing existing tables

// Main topics table for quantitative reasoning
export const quantTopics = pgTable('quantTopics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
});

// Subtopics for quantitative reasoning
export const quantSubtopics = pgTable('quantSubtopics', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => quantTopics.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
}, (table) => {
  return {
    uniqueTopicSubtopic: unique().on(table.topicId, table.name)
  };
});

// Quantitative questions table
export const quantQuestions = pgTable('quantQuestions', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => quantTopics.id),
  subtopicId: integer('subtopic_id').notNull().references(() => quantSubtopics.id),
  questionTypeId: integer('question_type_id').notNull().references(() => questionType.id),
  difficultyLevelId: integer('difficulty_level_id').notNull().references(() => difficultyLevels.id),
  question: text('question').notNull(),
  options: jsonb('options').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation').notNull(),
  formula: text('formula'),
  timeAllocation: integer('time_allocation').notNull().default(60),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
});

// Test categories for quantitative reasoning
export const quantTestCategories = pgTable('quantTestCategories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  sequenceNumber: integer('sequence_number').notNull(),
  timeAllocation: integer('time_allocation').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
});

// Test categories to topics mapping
export const quantTestCategoryTopics = pgTable('quantTestCategoryTopics', {
  id: serial('id').primaryKey(),
  testCategoryId: integer('test_category_id').notNull().references(() => quantTestCategories.id),
  topicId: integer('topic_id').notNull().references(() => quantTopics.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
}, (table) => {
  return {
    uniqueTestCategoryTopic: unique().on(table.testCategoryId, table.topicId)
  };
});

// User test attempts
export const quantTestAttempts = pgTable('quantTestAttempts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  testCategoryId: integer('test_category_id').notNull().references(() => quantTestCategories.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  score: integer('score'),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers'),
  timeSpent: integer('time_spent'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// User question attempts
export const quantQuestionAttempts = pgTable('quantQuestionAttempts', {
  id: serial('id').primaryKey(),
  testAttemptId: integer('test_attempt_id').notNull().references(() => quantTestAttempts.id),
  questionId: integer('question_id').notNull().references(() => quantQuestions.id),
  userAnswer: text('user_answer'),
  isCorrect: boolean('is_correct'),
  timeSpent: integer('time_spent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// User topic progress
export const quantTopicProgress = pgTable('quantTopicProgress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  topicId: integer('topic_id').notNull().references(() => quantTopics.id),
  masteryLevel: integer('mastery_level').notNull().default(0),
  questionsAttempted: integer('questions_attempted').notNull().default(0),
  questionsCorrect: integer('questions_correct').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
}, (table) => {
  return {
    uniqueUserTopic: unique().on(table.userId, table.topicId)
  };
});

// User subtopic progress
export const quantSubtopicProgress = pgTable('quantSubtopicProgress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  subtopicId: integer('subtopic_id').notNull().references(() => quantSubtopics.id),
  masteryLevel: integer('mastery_level').notNull().default(0),
  questionsAttempted: integer('questions_attempted').notNull().default(0),
  questionsCorrect: integer('questions_correct').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
}, (table) => {
  return {
    uniqueUserSubtopic: unique().on(table.userId, table.subtopicId)
  };
});

// Relations
export const quantTopicsRelations = relations(quantTopics, ({ many }) => ({
  subtopics: many(quantSubtopics),
  questions: many(quantQuestions),
  testCategoryMappings: many(quantTestCategoryTopics)
}));

export const quantSubtopicsRelations = relations(quantSubtopics, ({ one, many }) => ({
  topic: one(quantTopics, {
    fields: [quantSubtopics.topicId],
    references: [quantTopics.id]
  }),
  questions: many(quantQuestions)
}));

export const quantQuestionsRelations = relations(quantQuestions, ({ one, many }) => ({
  topic: one(quantTopics, {
    fields: [quantQuestions.topicId],
    references: [quantTopics.id]
  }),
  subtopic: one(quantSubtopics, {
    fields: [quantQuestions.subtopicId],
    references: [quantSubtopics.id]
  }),
  questionType: one(questionType, {
    fields: [quantQuestions.questionTypeId],
    references: [questionType.id]
  }),
  attempts: many(quantQuestionAttempts)
}));

export const quantTestCategoriesRelations = relations(quantTestCategories, ({ many }) => ({
  topicMappings: many(quantTestCategoryTopics),
  attempts: many(quantTestAttempts)
}));

export const quantTestAttemptsRelations = relations(quantTestAttempts, ({ one, many }) => ({
  testCategory: one(quantTestCategories, {
    fields: [quantTestAttempts.testCategoryId],
    references: [quantTestCategories.id]
  }),
  questionAttempts: many(quantQuestionAttempts)
}));

export const quantQuestionAttemptsRelations = relations(quantQuestionAttempts, ({ one }) => ({
  testAttempt: one(quantTestAttempts, {
    fields: [quantQuestionAttempts.testAttemptId],
    references: [quantTestAttempts.id]
  }),
  question: one(quantQuestions, {
    fields: [quantQuestionAttempts.questionId],
    references: [quantQuestions.id]
  })
}));

export const quantTopicProgressRelations = relations(quantTopicProgress, ({ one }) => ({
  topic: one(quantTopics, {
    fields: [quantTopicProgress.topicId],
    references: [quantTopics.id]
  })
}));

export const quantSubtopicProgressRelations = relations(quantSubtopicProgress, ({ one }) => ({
  subtopic: one(quantSubtopics, {
    fields: [quantSubtopicProgress.subtopicId],
    references: [quantSubtopics.id]
  })
}));

// Types
export type QuantTopic = typeof quantTopics.$inferSelect;
export type NewQuantTopic = typeof quantTopics.$inferInsert;

export type QuantSubtopic = typeof quantSubtopics.$inferSelect;
export type NewQuantSubtopic = typeof quantSubtopics.$inferInsert;

export type QuantQuestion = typeof quantQuestions.$inferSelect;
export type NewQuantQuestion = typeof quantQuestions.$inferInsert;

export type QuantTestCategory = typeof quantTestCategories.$inferSelect;
export type NewQuantTestCategory = typeof quantTestCategories.$inferInsert;

export type QuantTestCategoryTopic = typeof quantTestCategoryTopics.$inferSelect;
export type NewQuantTestCategoryTopic = typeof quantTestCategoryTopics.$inferInsert;

export type QuantTestAttempt = typeof quantTestAttempts.$inferSelect;
export type NewQuantTestAttempt = typeof quantTestAttempts.$inferInsert;

export type QuantQuestionAttempt = typeof quantQuestionAttempts.$inferSelect;
export type NewQuantQuestionAttempt = typeof quantQuestionAttempts.$inferInsert;

export type QuantTopicProgress = typeof quantTopicProgress.$inferSelect;
export type NewQuantTopicProgress = typeof quantTopicProgress.$inferInsert;

export type QuantSubtopicProgress = typeof quantSubtopicProgress.$inferSelect;
export type NewQuantSubtopicProgress = typeof quantSubtopicProgress.$inferInsert;