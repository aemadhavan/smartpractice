import {integer, pgTable, serial, text, timestamp,boolean } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: text('name').unique().notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const difficultyLevels = pgTable('difficultyLevels', {
    id: serial('id').primaryKey(),
    name: text('name').unique().notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const questionType = pgTable('questionType', {
    id: serial('id').primaryKey(),
    name: text('name').unique().notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const questions = pgTable('questions', {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id').notNull().references(() => categories.id),
    questionTypeId: integer('question_type_id').notNull().references(() => questionType.id),
    difficultyLevelId: integer('difficulty_level_id').notNull().references(() => difficultyLevels.id),    
    question: text('question').notNull(),
    correctAnswerId: integer('correct_answer_id'),
    solutionExplanation : text('solution_explanation'),
    marks : integer('marks').notNull().default(1),
    timeAllocation : integer('time_allocation').notNull().default(60),
    createdBy : integer('created_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),    
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    isActive:boolean('is_active').notNull().default(true),
})

export const answers = pgTable('answers', {
    id: serial('id').primaryKey(),
    questionId: integer('question_id').notNull().references(() => questions.id),
    answer: text('answer').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    sequenceNumber: integer('sequence_number'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    isActive:boolean('is_active').notNull().default(true)
})

export const topics = pgTable('topics', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    isActive:boolean('is_active').notNull().default(true)
})

export const questionTopics = pgTable('questionTopics', {
    id: serial('id').primaryKey(),
    questionId: integer('question_id').notNull().references(() => questions.id),
    topicId: integer('topic_id').notNull().references(() => topics.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    isActive:boolean('is_active').notNull().default(true)
})


