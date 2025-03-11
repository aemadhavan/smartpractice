// Mathematical Reasoning Schema
import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb, unique } from 'drizzle-orm/pg-core';
import { difficultyLevels, questionType } from './schema'; // Reusing existing tables

// Main topics table for mathematical reasoning
export const mathTopics = pgTable('mathTopics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
});

// Subtopics for mathematical reasoning
export const mathSubtopics = pgTable('mathSubtopics', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => mathTopics.id),
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

// Define the Option type for TypeScript
type Option = {
  id: string; // e.g., "o1", "o2", etc.
  text: string; // e.g., "40 men, 60 women"
};

// Mathematical questions table
export const mathQuestions = pgTable('mathQuestions', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => mathTopics.id),
  subtopicId: integer('subtopic_id').notNull().references(() => mathSubtopics.id),
  questionTypeId: integer('question_type_id').notNull().references(() => questionType.id),
  difficultyLevelId: integer('difficulty_level_id').notNull().references(() => difficultyLevels.id),
  question: text('question').notNull(),
  options: jsonb('options').notNull()
    .$type<Option[]>()
    .default([]),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation').notNull(),
  formula: text('formula'),
  timeAllocation: integer('time_allocation').notNull().default(60),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
});

// Test categories for mathematical reasoning
export const mathTestCategories = pgTable('mathTestCategories', {
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
export const mathTestCategoryTopics = pgTable('mathTestCategoryTopics', {
  id: serial('id').primaryKey(),
  testCategoryId: integer('test_category_id').notNull().references(() => mathTestCategories.id),
  topicId: integer('topic_id').notNull().references(() => mathTopics.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
}, (table) => {
  return {
    uniqueTestCategoryTopic: unique().on(table.testCategoryId, table.topicId)
  };
});

// User test attempts
export const mathTestAttempts = pgTable('mathTestAttempts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  subtopicId: integer('subtopic_id').notNull().references(() => mathSubtopics.id),
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
export const mathQuestionAttempts = pgTable('mathQuestionAttempts', {
  id: serial('id').primaryKey(),
  testAttemptId: integer('test_attempt_id').notNull().references(() => mathTestAttempts.id),
  questionId: integer('question_id').notNull().references(() => mathQuestions.id),
  userAnswer: text('user_answer'),
  isCorrect: boolean('is_correct').notNull().default(false),
  timeSpent: integer('time_spent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// User topic progress
export const mathTopicProgress = pgTable('mathTopicProgress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  topicId: integer('topic_id').notNull().references(() => mathTopics.id),
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
export const mathSubtopicProgress = pgTable('mathSubtopicProgress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  subtopicId: integer('subtopic_id').notNull().references(() => mathSubtopics.id),
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

// Real-world applications table
export const mathRealWorldApplications = pgTable('mathRealWorldApplications', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
});

// Mapping between subtopics and real-world applications
export const mathSubtopicApplications = pgTable('mathSubtopicApplications', {
  id: serial('id').primaryKey(),
  subtopicId: integer('subtopic_id').notNull().references(() => mathSubtopics.id),
  applicationId: integer('application_id').notNull().references(() => mathRealWorldApplications.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
}, (table) => {
  return {
    uniqueSubtopicApplication: unique().on(table.subtopicId, table.applicationId)
  };
});

// Relations
export const mathTopicsRelations = relations(mathTopics, ({ many }) => ({
  subtopics: many(mathSubtopics),
  questions: many(mathQuestions),
  testCategoryMappings: many(mathTestCategoryTopics)
}));

export const mathSubtopicsRelations = relations(mathSubtopics, ({ one, many }) => ({
  topic: one(mathTopics, {
    fields: [mathSubtopics.topicId],
    references: [mathTopics.id]
  }),
  questions: many(mathQuestions),
  applications: many(mathSubtopicApplications)
}));

export const mathQuestionsRelations = relations(mathQuestions, ({ one, many }) => ({
  topic: one(mathTopics, {
    fields: [mathQuestions.topicId],
    references: [mathTopics.id]
  }),
  subtopic: one(mathSubtopics, {
    fields: [mathQuestions.subtopicId],
    references: [mathSubtopics.id]
  }),
  questionType: one(questionType, {
    fields: [mathQuestions.questionTypeId],
    references: [questionType.id]
  }),
  attempts: many(mathQuestionAttempts)
}));

export const mathTestCategoriesRelations = relations(mathTestCategories, ({ many }) => ({
  topicMappings: many(mathTestCategoryTopics),
  attempts: many(mathTestAttempts)
}));

export const mathTestAttemptsRelations = relations(mathTestAttempts, ({ one, many }) => ({
  subtopic: one(mathSubtopics, {
    fields: [mathTestAttempts.subtopicId],
    references: [mathSubtopics.id]
  }),
  questionAttempts: many(mathQuestionAttempts)
}));

export const mathQuestionAttemptsRelations = relations(mathQuestionAttempts, ({ one }) => ({
  testAttempt: one(mathTestAttempts, {
    fields: [mathQuestionAttempts.testAttemptId],
    references: [mathTestAttempts.id]
  }),
  question: one(mathQuestions, {
    fields: [mathQuestionAttempts.questionId],
    references: [mathQuestions.id]
  })
}));

export const mathTopicProgressRelations = relations(mathTopicProgress, ({ one }) => ({
  topic: one(mathTopics, {
    fields: [mathTopicProgress.topicId],
    references: [mathTopics.id]
  })
}));

export const mathSubtopicProgressRelations = relations(mathSubtopicProgress, ({ one }) => ({
  subtopic: one(mathSubtopics, {
    fields: [mathSubtopicProgress.subtopicId],
    references: [mathSubtopics.id]
  })
}));

export const mathRealWorldApplicationsRelations = relations(mathRealWorldApplications, ({ many }) => ({
  subtopics: many(mathSubtopicApplications)
}));

export const mathSubtopicApplicationsRelations = relations(mathSubtopicApplications, ({ one }) => ({
  subtopic: one(mathSubtopics, {
    fields: [mathSubtopicApplications.subtopicId],
    references: [mathSubtopics.id]
  }),
  application: one(mathRealWorldApplications, {
    fields: [mathSubtopicApplications.applicationId],
    references: [mathRealWorldApplications.id]
  })
}));

// Types
export type MathTopic = typeof mathTopics.$inferSelect;
export type NewMathTopic = typeof mathTopics.$inferInsert;

export type MathSubtopic = typeof mathSubtopics.$inferSelect;
export type NewMathSubtopic = typeof mathSubtopics.$inferInsert;

export type MathQuestion = typeof mathQuestions.$inferSelect;
export type NewMathQuestion = typeof mathQuestions.$inferInsert;

export type MathTestCategory = typeof mathTestCategories.$inferSelect;
export type NewMathTestCategory = typeof mathTestCategories.$inferInsert;

export type MathTestCategoryTopic = typeof mathTestCategoryTopics.$inferSelect;
export type NewMathTestCategoryTopic = typeof mathTestCategoryTopics.$inferInsert;

export type MathTestAttempt = typeof mathTestAttempts.$inferSelect;
export type NewMathTestAttempt = typeof mathTestAttempts.$inferInsert;

export type MathQuestionAttempt = typeof mathQuestionAttempts.$inferSelect;
export type NewMathQuestionAttempt = typeof mathQuestionAttempts.$inferInsert;

export type MathTopicProgress = typeof mathTopicProgress.$inferSelect;
export type NewMathTopicProgress = typeof mathTopicProgress.$inferInsert;

export type MathSubtopicProgress = typeof mathSubtopicProgress.$inferSelect;
export type NewMathSubtopicProgress = typeof mathSubtopicProgress.$inferInsert;

export type MathRealWorldApplication = typeof mathRealWorldApplications.$inferSelect;
export type NewMathRealWorldApplication = typeof mathRealWorldApplications.$inferInsert;

export type MathSubtopicApplication = typeof mathSubtopicApplications.$inferSelect;
export type NewMathSubtopicApplication = typeof mathSubtopicApplications.$inferInsert;