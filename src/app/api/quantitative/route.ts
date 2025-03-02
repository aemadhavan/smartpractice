// File: src/app/api/quantitative/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getDb, executeWithRetry } from '@/db/index';
import { 
  quantTopics, 
  quantQuestions,
  quantTopicProgress
} from '@/db/quantitative-schema';
import { eq, count, and } from 'drizzle-orm';

// GET: Retrieve all quantitative topics with counts and progress
export async function GET(request: NextRequest) {
  try {
    console.log('Starting API request for quantitative topics');
    
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get DB connection - now properly awaited
    console.log('Getting database connection...');
    const db = await getDb();
    console.log('Database connection obtained');
    
    // Fetch all active topics with retry logic
    console.log('Fetching topics...');
    const topics = await executeWithRetry(() => 
      db.select().from(quantTopics).where(eq(quantTopics.isActive, true))
    );
    console.log(`Successfully fetched ${topics.length} topics`);
    
    // Create a map to store question counts per topic
    console.log('Fetching question counts...');
    const questionCountsPromise = executeWithRetry(() =>
      db.select({
        topicId: quantQuestions.topicId,
        count: count(quantQuestions.id)
      })
      .from(quantQuestions)
      .where(eq(quantQuestions.isActive, true))
      .groupBy(quantQuestions.topicId)
    );

    // Get user progress for each topic - using and() for multiple conditions
    console.log('Fetching user progress...');
    const userProgressPromise = executeWithRetry(() =>
      db.select()
        .from(quantTopicProgress)
        .where(and(
          eq(quantTopicProgress.userId, userId),
          eq(quantTopicProgress.isActive, true)
        ))
    );

    // Wait for all promises to resolve
    console.log('Waiting for all database queries to complete...');
    const [questionCounts, userProgress] = await Promise.all([
      questionCountsPromise,
      userProgressPromise
    ]);
    console.log('All database queries completed successfully');

    // Create a map for question counts
    const questionCountMap = new Map();
    questionCounts.forEach(item => {
      questionCountMap.set(item.topicId, Number(item.count));
    });

    // Create a map for user progress
    const progressMap = new Map();
    if (userProgress && userProgress.length > 0) {
      userProgress.forEach(progress => {
        progressMap.set(progress.topicId, progress);
      });
    }

    // Calculate recent activity to determine if topic has new content
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Build the response with additional data
    const topicsWithDetails = topics.map(topic => {
      const questionCount = questionCountMap.get(topic.id) || 0;
      const progress = progressMap.get(topic.id);
      
      // Calculate mastery percentage based on mastered questions vs total questions
      let masteryPercentage = 0;
      let hasAttempted = false;

      if (progress) {
        hasAttempted = progress.questionsAttempted > 0;
        
        if (questionCount > 0) {
          // Ensure correctQuestions doesn't exceed total questions
          const correctQuestions = Math.min(progress.questionsCorrect, questionCount);
          masteryPercentage = Math.round((correctQuestions / questionCount) * 100);
        } else if (progress.questionsAttempted > 0) {
          // Fallback if we somehow don't have a question count but have attempts
          const correctQuestions = Math.min(progress.questionsCorrect, progress.questionsAttempted);
          masteryPercentage = Math.round((correctQuestions / progress.questionsAttempted) * 100);
        }
        
        // Ensure percentage never exceeds 100%
        masteryPercentage = Math.min(masteryPercentage, 100);
      }

      // Check if topic has new content (based on creation date or recent update)
      const hasNewContent = new Date(topic.updatedAt) > threeDaysAgo;

      return {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        problems: questionCount,
        masteryPercentage,
        hasAttempted,
        hasNewContent,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt
      };
    });

    // Get total stats
    const totalProblems = Array.from(questionCountMap.values()).reduce((sum, count) => sum + count, 0);
    
    // FIX: Count mastered questions across all topics, not mastered topics
    let totalMasteredQuestions = 0;
    if (userProgress && userProgress.length > 0) {
      totalMasteredQuestions = userProgress.reduce((sum, progress) => sum + progress.questionsCorrect, 0);
    }

    // Get daily goal progress
    const dailyGoal = 20; // Default daily goal
    let dailyProgress = 0;
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count today's question attempts
    // Note: This is a simplified approach. In a real app, you might have a separate table for tracking daily goals
    // This would require adding additional query to fetch today's attempts
    dailyProgress = 7; // Placeholder value - would be replaced with actual query

    console.log('API request completed successfully');
    return NextResponse.json({ 
      topics: topicsWithDetails,
      stats: {
        totalProblems,
        masteredCount: totalMasteredQuestions,
        dailyGoal,
        dailyProgress
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching quantitative topics:', error);
    
    // Type-safe error handling
    const errorDetails: {
      message: string;
      name?: string;
      stack?: string;
      code?: string;
    } = {
      message: error instanceof Error ? error.message : String(error)
    };
    
    // Add additional properties if error is an Error object
    if (error instanceof Error) {
      errorDetails.name = error.name;
      errorDetails.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
      
      // Handle PostgreSQL error codes if present
      const pgError = error as Error & { code?: string };
      if (pgError.code) {
        errorDetails.code = pgError.code;
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch quantitative topics',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}