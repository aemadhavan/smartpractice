// File: src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolConfig } from "pg";
import { sql } from "drizzle-orm";
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
let isConnecting = false;
let connectionErrors = 0;

// Connection pool configuration - using only supported properties
const connectionOptions: PoolConfig = {
    max: 10,                      // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,     // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 10000, // Increased from 2000ms to 10000ms (10 seconds)
    allowExitOnIdle: false        // Don't allow the pool to exit while we have clients
};

/**
 * Initialize a fresh database connection pool with retry logic
 */
async function initializePool(retryAttempt = 0, maxRetries = 3): Promise<Pool> {
  const connectionString = process.env.XATA_DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('Database connection string not found in environment variables');
  }

  try {
    // Create a new pool
    const newPool = new Pool({ 
      connectionString, 
      ...connectionOptions 
    });
    
    // Set up event handlers
    newPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
      connectionErrors++;
      
      // If we've had too many errors, force a new connection on next request
      if (connectionErrors > 5) {
        console.log('Too many connection errors, will recreate connection pool on next request');
        poolInstance = null;
        dbInstance = null;
        connectionErrors = 0;
      }
    });
    
    newPool.on('connect', () => {
      console.log('PostgreSQL client connected successfully');
      connectionErrors = 0; // Reset error counter on successful connection
    });

    // Test the connection before returning
    const client = await newPool.connect();
    await client.query('SELECT 1'); // Simple query to test connection
    client.release();
    console.log('Database connection test successful');
    return newPool;
    
  } catch (error: unknown) {
    // Implement retry logic manually
    if (retryAttempt < maxRetries) {
      const nextRetry = retryAttempt + 1;
      const retryDelay = Math.min(Math.pow(2, nextRetry) * 1000, 10000); // Exponential backoff with 10s max
      
      console.error(`Database connection attempt ${nextRetry} failed:`, error);
      console.log(`Retrying in ${retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return initializePool(nextRetry, maxRetries);
    } else {
      console.error(`Failed to connect to database after ${maxRetries} attempts:`, error);
      throw error;
    }
  }
}

/**
 * Gets or creates the database instance with proper connection pooling and retry logic
 */
export async function getDb() {
  // If we already have a valid instance, return it immediately
  if (dbInstance) {
    return dbInstance;
  }
  
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait for the ongoing connection attempt to finish
    console.log('Connection attempt already in progress, waiting...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getDb(); // Recursive call after waiting
  }
  
  isConnecting = true;
  
  try {
    console.log('Creating new database connection...');
    poolInstance = await initializePool();
    
    console.log('Creating new Drizzle instance');
    dbInstance = drizzle(poolInstance, { schema });
    
    return dbInstance;
  } catch (error: unknown) {
    console.error('Fatal database connection error:', error);
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Creates a backward compatible version that returns a promise
 * to avoid having to refactor all existing code
 */
export function getDbSync() {
  if (dbInstance) {
    return dbInstance;
  }
  
  // If we don't have a connection, create one but return synchronously
  // This is not ideal but maintains compatibility
  console.log('Warning: Synchronous DB access requested before async initialization');
  
  // Start the connection process in the background
  getDb().catch(err => console.error('Background DB connection failed:', err));
  
  // Create a temporary DB instance with the same interface
  // that will connect properly on the next query
  if (!poolInstance) {
    poolInstance = new Pool({ 
      connectionString: process.env.XATA_DATABASE_URL, 
      ...connectionOptions 
    });
  }
  
  if (!dbInstance) {
    dbInstance = drizzle(poolInstance, { schema });
  }
  
  return dbInstance;
}

/**
 * For backwards compatibility - direct export of the db instance
 * This will use the singleton pattern internally
 */
export const db = getDbSync();

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

/**
 * Utility function for database operations with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>, 
  maxRetries = 3, 
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown;
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      console.log(`Database operation attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
      }
    }
  }
  
  throw lastError;
}

/**
 * Handle health check and connection test
 */
export async function testDbConnection() {
  try {
    const db = await getDb();
    // Run a simple query to test the connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Database connection test result:', result);
    return { status: 'ok', message: 'Database connection successful' };
  } catch (error: unknown) {
    console.error('Database health check failed:', error);
    // Safely handle the error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { status: 'error', message: errorMessage };
  }
}