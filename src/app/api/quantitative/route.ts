// File: src/app/api/quantitative/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db/index';
import { 
  quantTopics, 
  quantQuestions,
  quantTopicProgress
} from '@/db/quantitative-schema';
import { eq, sql, count, and } from 'drizzle-orm';

// GET: Retrieve all quantitative topics with counts and progress
export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch all active topics
    const topics = await db.select().from(quantTopics).where(eq(quantTopics.isActive, true));
    
    // Get all topic IDs
    const topicIds = topics.map(topic => topic.id);

    // Create a map to store question counts per topic
    const questionCountsPromise = db.select({
      topicId: quantQuestions.topicId,
      count: count(quantQuestions.id)
    })
    .from(quantQuestions)
    .where(eq(quantQuestions.isActive, true))
    .groupBy(quantQuestions.topicId);

    // Get user progress for each topic - using and() for multiple conditions
    const userProgressPromise = db.select()
      .from(quantTopicProgress)
      .where(and(
        eq(quantTopicProgress.userId, userId),
        eq(quantTopicProgress.isActive, true)
      ));

    // Wait for all promises to resolve
    const [questionCounts, userProgress] = await Promise.all([
      questionCountsPromise,
      userProgressPromise
    ]);

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
      
      // Calculate mastery percentage
      let masteryPercentage = 0;
      let hasAttempted = false;
      if (progress) {
        hasAttempted = progress.questionsAttempted > 0;
        if (progress.questionsAttempted > 0) {
          masteryPercentage = Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100);
        }
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
    
    // Count mastered topics (topics with masteryPercentage >= 80%)
    const masteredCount = userProgress ? 
      userProgress.filter(progress => 
        progress.questionsAttempted > 0 && 
        (progress.questionsCorrect / progress.questionsAttempted) >= 0.8
      ).length : 0;

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

    return NextResponse.json({ 
      topics: topicsWithDetails,
      stats: {
        totalProblems,
        masteredCount,
        dailyGoal,
        dailyProgress
      }
    });

  } catch (error) {
    console.error('Error fetching quantitative topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quantitative topics' },
      { status: 500 }
    );
  }
}