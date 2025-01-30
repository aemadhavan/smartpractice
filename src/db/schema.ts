import { eq, relations } from 'drizzle-orm';
import {integer, pgTable, serial, text, timestamp,boolean, char } from 'drizzle-orm/pg-core';

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

export const waitlist = pgTable('waitlist', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    consent: boolean('consent').notNull().default(false),
    referralSource: text('referral_source'),
    status: text('status').notNull().default('pending'), // pending, confirmed, unsubscribed
  });

  export const alphabetCategories = pgTable('alphabetCategories', {
    id: serial('id').primaryKey(),
    letter: char('letter', { length: 1 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true)
})

export const vocabulary = pgTable('vocabulary', {
    id: serial('id').primaryKey(),
    word: text('word').notNull(),
    definition: text('definition').notNull(),
    synonyms: text('synonyms'),//.notNull(),
    antonyms: text('antonyms'),//.notNull(),
    partOfSpeech: text('part_of_speech').notNull(),
    sentence: text('sentence'),

    categoryId: integer('category_id').references(() => alphabetCategories.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true)
});

// Relations
// Relations
export const alphabetCategoriesRelations = relations(alphabetCategories, ({ many }) => ({
    words: many(vocabulary)
}));

export const vocabularyRelations = relations(vocabulary, ({ one }) => ({
    category: one(alphabetCategories, {
        fields: [vocabulary.categoryId],
        references: [alphabetCategories.id],
    })
}));

// Types
export type AlphabetCategory = typeof alphabetCategories.$inferSelect;
export type NewAlphabetCategory = typeof alphabetCategories.$inferInsert;

export type Vocabulary = typeof vocabulary.$inferSelect;
export type NewVocabulary = typeof vocabulary.$inferInsert;