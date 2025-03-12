//File: /api/maths/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db/index';
import { 
  mathTopics, 
  mathQuestions,
  mathTopicProgress
} from '@/db/maths-schema';
import { eq, count, and } from 'drizzle-orm';

// GET: Retrieve all math topics with counts and progress
export async function GET(request: NextRequest) {
  try {
    console.log('Starting API request for math topics');
    
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log('Getting database connection...');
    console.log('Database connection obtained');
    
    // Fetch all active topics
    console.log('Fetching topics...');
    const topics = await db
      .select()
      .from(mathTopics)
      .where(eq(mathTopics.isActive, true));
    
    console.log(`Successfully fetched ${topics.length} topics`);
    
    // Create a map to store question counts per topic
    console.log('Fetching question counts...');
    const questionCountsPromise = db
      .select({
        topicId: mathQuestions.topicId,
        count: count(mathQuestions.id)
      })
      .from(mathQuestions)
      .where(eq(mathQuestions.isActive, true))
      .groupBy(mathQuestions.topicId);

    // Get user progress for each topic
    console.log('Fetching user progress...');
    const userProgressPromise = db
      .select()
      .from(mathTopicProgress)
      .where(and(
        eq(mathTopicProgress.userId, userId),
        eq(mathTopicProgress.isActive, true)
      ));

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
    
    // Count mastered questions across all topics
    let totalMasteredQuestions = 0;
    if (userProgress && userProgress.length > 0) {
      totalMasteredQuestions = userProgress.reduce((sum, progress) => sum + progress.questionsCorrect, 0);
    }

    // Get daily goal progress
    const dailyGoal = 20; // Default daily goal
    let dailyProgress = 7; // Placeholder value - would be replaced with actual query

    console.log('API request completed successfully');
    return NextResponse.json({ 
      success: true,
      topics: topicsWithDetails,
      stats: {
        totalProblems,
        masteredCount: totalMasteredQuestions,
        dailyGoal,
        dailyProgress
      }
    });

  } catch (error) {
    console.error('Error fetching math topics:', error);
    
    // Type-safe error handling
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error)
    };
    
    // Add additional properties if error is an Error object
    if (error instanceof Error) {
      Object.assign(errorDetails, {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // Handle PostgreSQL error codes if present
      const pgError = error as Error & { code?: string };
      if (pgError.code) {
        Object.assign(errorDetails, { code: pgError.code });
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch math topics',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}