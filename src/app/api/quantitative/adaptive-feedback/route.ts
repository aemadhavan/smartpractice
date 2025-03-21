// src/app/api/quantitative/adaptive-feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { updateQuantLearningGaps } from '@/lib/quantitative-adaptive-learning';
// Uncomment these imports to ensure schema references are available
//import { quantTestAttempts } from '@/db/quantitative-schema';
import { type QuantLearningGap } from '@/db/quantitative-adaptive-schema';

export const dynamic = 'force-dynamic';

// POST to process test results and update learning gaps
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body safely
    let data;
    try {
      data = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { testAttemptId, questionResults } = data;

    if (!testAttemptId || !questionResults || !Array.isArray(questionResults)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the test attempt to determine subtopic
    let testAttempt;
    try {
      testAttempt = await db.query.quantTestAttempts.findFirst({
        where: (attempts, { eq, and }) => 
          and(
            eq(attempts.id, testAttemptId),
            eq(attempts.userId, userId)
          )
      });
    } catch (error) {
      console.error('Error fetching test attempt:', error);
      // Provide a fallback response with default recommendations
      return fallbackResponse();
    }

    if (!testAttempt) {
      return NextResponse.json(
        { success: false, error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Process question results
    const formattedResults = questionResults.map(result => ({
      id: result.questionId,
      isCorrect: result.isCorrect
    }));

    // Update learning gaps with error handling
    try {
      await updateQuantLearningGaps(userId, testAttempt.subtopicId, formattedResults);
    } catch (error) {
      console.error('Error updating learning gaps:', error);
      // Continue with the request - we can still provide recommendations
    }

    // Get updated learning gaps for this subtopic (with error handling)
    let gaps: QuantLearningGap[] = [];
    try {
      gaps = await db.query.quantLearningGaps.findMany({
        where: (gaps, { eq, and, isNull }) => 
          and(
            eq(gaps.userId, userId),
            eq(gaps.subtopicId, testAttempt.subtopicId),
            isNull(gaps.resolvedAt)
          )
      });
    } catch (error) {
      console.error('Error fetching learning gaps:', error);
      // Continue without gaps data
    }

    // Generate adaptive recommendations
    const recommendations = [];
    
    if (gaps && gaps.length > 0) {
      recommendations.push({
        type: 'learning_gap',
        message: 'We noticed you might need more practice in specific quantitative reasoning areas.',
        action: 'Continue practicing with adaptive questions focused on your learning gaps.'
      });
    }

    const correctCount = formattedResults.filter(r => r.isCorrect).length;
    const totalCount = formattedResults.length;
    const correctPercentage = Math.round((correctCount / totalCount) * 100);

    if (correctPercentage < 60) {
      recommendations.push({
        type: 'performance',
        message: 'You might benefit from reviewing core quantitative reasoning concepts.',
        action: 'Try reviewing problem-solving strategies and fundamental quantitative skills.'
      });
    } else if (correctPercentage >= 85) {
      recommendations.push({
        type: 'progression',
        message: 'Outstanding performance in quantitative reasoning!',
        action: 'You might be ready to tackle more advanced quantitative problems.'
      });
    }

    // Make sure we always have at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        message: 'Keep practicing to improve your quantitative reasoning skills.',
        action: 'Regular practice is key to mastering these concepts.'
      });
    }

    return NextResponse.json({
      success: true,
      gaps: gaps || [],
      recommendations,
      performanceMetrics: {
        correctCount,
        totalCount,
        correctPercentage
      }
    });
  } catch (error) {
    console.error('Error in quantitative adaptive feedback:', error);
    return fallbackResponse();
  }
}

// Helper function for consistent fallback responses
function fallbackResponse() {
  return NextResponse.json({
    success: true, // Changed to true for better UX
    error: 'Could not process adaptive learning data',
    gaps: [],
    recommendations: [{
      type: 'general',
      message: 'Keep practicing to build your quantitative reasoning skills.',
      action: 'Try a variety of problem types to strengthen your understanding.'
    }],
    performanceMetrics: {
      correctCount: 0,
      totalCount: 0,
      correctPercentage: 0
    }
  }, { status: 200 }); // Return 200 even in error case to avoid breaking UI
}