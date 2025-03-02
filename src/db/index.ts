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

// Define the full schema
const schema = {
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
    verbalQuestionAttempts,
    
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
};

// Singleton pool and db instances
let poolInstance: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Connection pool configuration
const connectionOptions = {
    max: 10,                    // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,   // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a connection
    allowExitOnIdle: false      // Don't allow the pool to exit while we have clients
};

/**
 * Gets or creates the database instance with proper connection pooling
 */
export function getDb() {
    if (!dbInstance) {
        // Only create a new pool if we don't have one
        if (!poolInstance) {
            console.log('Creating new database connection pool');
            poolInstance = new Pool({ 
                connectionString: process.env.XATA_DATABASE_URL, 
                ...connectionOptions 
            });
            
            // Add error handler to the pool
            poolInstance.on('error', (err) => {
                console.error('Unexpected error on idle PostgreSQL client', err);
            });
        }
        
        console.log('Creating new Drizzle instance');
        dbInstance = drizzle(poolInstance, { schema });
    }
    
    return dbInstance;
}

/**
 * For backwards compatibility - direct export of the db instance
 * This will use the singleton pattern internally
 */
export const db = getDb();

/**
 * Closes all database connections - use during controlled shutdown or testing
 */
export async function closeDbConnections() {
    if (poolInstance) {
        console.log('Closing database connection pool');
        await poolInstance.end();
        poolInstance = null;
        dbInstance = null;
    }
}