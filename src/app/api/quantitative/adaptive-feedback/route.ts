// src/app/api/quantitative/adaptive-feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { updateQuantLearningGaps } from '@/lib/quantitative-adaptive-learning' ;
//import { quantTestAttempts } from '@/db/quantitative-schema';
//import { quantLearningGaps } from '@/db/quantitative-adaptive-schema';

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

    const data = await request.json();
    const { testAttemptId, questionResults } = data;

    if (!testAttemptId || !questionResults || !Array.isArray(questionResults)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the test attempt to determine subtopic
    const testAttempt = await db.query.quantTestAttempts.findFirst({
      where: (attempts, { eq, and }) => 
        and(
          eq(attempts.id, testAttemptId),
          eq(attempts.userId, userId)
        )
    });

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

    // Update learning gaps
    await updateQuantLearningGaps(userId, testAttempt.subtopicId, formattedResults);

    // Get updated learning gaps for this subtopic
    const gaps = await db.query.quantLearningGaps.findMany({
      where: (gaps, { eq, and, isNull }) => 
        and(
          eq(gaps.userId, userId),
          eq(gaps.subtopicId, testAttempt.subtopicId),
          isNull(gaps.resolvedAt)
        )
    });

    // Generate adaptive recommendations
    const recommendations = [];
    
    if (gaps.length > 0) {
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

    return NextResponse.json({
      success: true,
      gaps,
      recommendations,
      performanceMetrics: {
        correctCount,
        totalCount,
        correctPercentage
      }
    });
  } catch (error) {
    console.error('Error in quantitative adaptive feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}