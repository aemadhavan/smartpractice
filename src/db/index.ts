// File: src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolConfig } from "pg";
import { sql } from "drizzle-orm";
import * as dns from 'dns';
import * as net from 'net';

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
import { mathQuestionAttempts, 
  mathQuestions, 
  mathSubtopicProgress, 
  mathSubtopics, 
  mathTestAttempts, 
  mathTestCategories, 
  mathTopicProgress, 
  mathTopics } from "./maths-schema";

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
    quantSubtopicProgress,

    //mathematical reasoning schemas
    mathTopics,
    mathSubtopics,
    mathQuestions,
    mathTestCategories,
    mathTestAttempts,
    mathQuestionAttempts,
    mathTopicProgress,
    mathSubtopicProgress

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
    connectionTimeoutMillis: 20000, // Increased from 2000ms to 20000ms (20 seconds)
    allowExitOnIdle: false,        // Don't allow the pool to exit while we have clients
    ssl: process.env.POSTGRES_USE_SSL === 'true' ? {
        rejectUnauthorized: process.env.POSTGRES_REJECT_UNAUTHORIZED !== 'false'
    } : undefined
};

/**
 * Initialize a fresh database connection pool with retry logic
 */
/**
 * Initialize a fresh database connection pool with improved diagnostics and retry logic
 */
async function initializePool(retryAttempt = 0, maxRetries = 3): Promise<Pool> {
  const connectionString = process.env.XATA_DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('Database connection string not found in environment variables');
  }

  console.log(`Connecting to database: ${maskConnectionString(connectionString)}`);
  
  // Run diagnostics on first attempt
  if (retryAttempt === 0) {
    await runConnectionDiagnostics(connectionString);
  }

  try {
    // Create a new pool
    console.log('Creating connection pool...');
    const newPool = new Pool({ 
      connectionString, 
      ...connectionOptions,
      // Add application_name for better identification in database logs
      application_name: 'smartpractice_app' 
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
    console.log('Testing database connection...');
    const client = await newPool.connect();
    console.log('Connection established, running test query...');
    const result = await client.query('SELECT version()');
    console.log(`Database connection test successful. Server version: ${result.rows[0].version}`);
    client.release();
    return newPool;
    
  } catch (error: unknown) {
    // Log detailed error information
    console.error(`Database connection attempt ${retryAttempt + 1} failed:`);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    } else {
      console.error(`Unknown error type:`, error);
    }
    
    // Implement retry logic with more detailed logging
    if (retryAttempt < maxRetries) {
      const nextRetry = retryAttempt + 1;
      const retryDelay = Math.min(Math.pow(2, nextRetry) * 1000, 10000); // Exponential backoff with 10s max
      
      console.log(`Retrying in ${retryDelay}ms (attempt ${nextRetry}/${maxRetries})...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return initializePool(nextRetry, maxRetries);
    } else {
      console.error(`Failed to connect to database after ${maxRetries} attempts`);
      throw error;
    }
  }
}

/**
 * Safely masks sensitive parts of the connection string for logging
 */
function maskConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    // Mask the password if present
    if (url.password) {
      url.password = '******';
    }
    return url.toString();
  } catch (e) {
    // If parsing fails, mask the entire string except for the protocol and host
    console.error('Failed to parse connection string:', e);
    const parts = connectionString.split('@');
    if (parts.length > 1) {
      return `[credentials masked]@${parts[parts.length - 1]}`;
    }
    return '[malformed connection string]';
  }
}
/**
 * Pre-connection diagnostics to help identify issues
 */
async function runConnectionDiagnostics(connectionString: string): Promise<void> {
  try {
    console.log('Running database connection diagnostics...');
    
    // Parse the connection URL
    const url = new URL(connectionString);
    const host = url.hostname;
    const port = url.port || '5432';
    
    console.log(`Testing connectivity to ${host}:${port}...`);
    
    // 1. Test DNS resolution
    try {
      console.log(`Resolving hostname: ${host}`);
      const addresses = await dns.promises.lookup(host, { all: true });
      console.log(`DNS resolution successful. IP addresses: ${addresses.map(a => a.address).join(', ')}`);
    } catch (err: unknown) {
      console.error(`DNS resolution failed for ${host}: ${err instanceof Error ? err.message : String(err)}`);
      console.log('This suggests the hostname cannot be resolved. Check your DNS settings and connection.');
      return;
    }
    
    // 2. Test TCP connectivity
    console.log(`Testing TCP connection to ${host}:${port}`);
    const socket = new net.Socket();
    
    try {
      await new Promise<void>((resolve, reject) => {
        // Set a timeout for the connection attempt
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
          console.log(`TCP connection successful to ${host}:${port}`);
          socket.end();
          resolve();
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error(`Connection timed out after 5 seconds`));
        });
        
        socket.on('error', (err) => {
          reject(err);
        });
        
        socket.connect(parseInt(port), host);
      });
    } catch (err: unknown) {
      console.error(`TCP connection failed to ${host}:${port}: ${err instanceof Error ? err.message : String(err)}`);
      console.log('This suggests a network connectivity issue or firewall blocking.');
      return;
    }
    
    console.log('Basic connectivity checks passed. Proceeding with PostgreSQL connection.');
  } catch (err) {
    console.error('Failed to run connection diagnostics:', err);
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
    // Reset connection state so next request will try again
    isConnecting = false;
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