import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { 
    categories,
    difficultyLevels,
    questionType,
    questions,
    alphabetCategories,
    vocabulary,
    userStreaks,
    vocabularyAttempts,
    vocabularyProgress,
    verbalTestCategories,
    verbalQuestions,
    verbalTestAttempts,
    verbalQuestionAttempts
} from "@/db/schema";

import {
    quantTopics,
    quantSubtopics,
    quantQuestions,
    quantTestCategories,
    quantTestCategoryTopics,
    quantTestAttempts,
    quantQuestionAttempts,
    quantTopicProgress,
    quantSubtopicProgress
} from "@/db/quantitative-schema";

const pool = new Pool({ connectionString: process.env.XATA_DATABASE_URL, max: 10 });
export const db = drizzle(pool,{schema: {categories,difficultyLevels,
                                        questionType,questions,
                                        alphabetCategories,
                                        vocabulary,userStreaks,vocabularyAttempts,vocabularyProgress,
                                        verbalTestCategories,verbalQuestions,verbalTestAttempts,verbalQuestionAttempts,
                                    
                                        // Quantitative reasoning schemas
        quantTopics,
        quantSubtopics,
        quantQuestions,
        quantTestCategories,
        quantTestCategoryTopics,
        quantTestAttempts,
        quantQuestionAttempts,
        quantTopicProgress,
        quantSubtopicProgress
                                    }});