// src/app/api/maths/adaptive-feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
//import { eq, and } from 'drizzle-orm';
//import { mathTestAttempts } from '@/db/maths-schema';
import { updateLearningGaps } from '@/lib/adaptive-learning';

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
    
    console.log('ADAPTIVE FEEDBACK PROCESSING - DETAILED', {
      userId,
      questionResults,
      timestamp: new Date().toISOString(),
      rawRequestData: data
    });

    if (!testAttemptId || !questionResults || !Array.isArray(questionResults)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the test attempt to determine subtopic
    const testAttempt = await db.query.mathTestAttempts.findFirst({
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
    await updateLearningGaps(userId, testAttempt.subtopicId, formattedResults);

    // Get updated learning gaps for this subtopic
    const gaps = await db.query.learningGaps.findMany({
      where: (gaps, { eq, and, isNull }) => 
        and(
          eq(gaps.userId, userId),
          eq(gaps.subtopicId, testAttempt.subtopicId),
          isNull(gaps.resolvedAt)
        )
    });

    // Add more detailed logging for gap detection and recommendation generation
    const gapsCreationLog = gaps.map(gap => ({
      gapId: gap.id,
      subtopicId: gap.subtopicId,
      conceptDescription: gap.conceptDescription,
      severity: gap.severity
    }));

    console.log('Learning Gaps Created', gapsCreationLog);

    // Generate adaptive recommendations
    const recommendations = [];
    
    if (gaps.length > 0) {
      recommendations.push({
        type: 'learning_gap',
        message: 'We noticed you might need more practice in specific areas.',
        action: 'Continue practicing with adaptive questions focused on your learning gaps.'
      });
    }

    const correctCount = formattedResults.filter(r => r.isCorrect).length;
    const totalCount = formattedResults.length;
    const correctPercentage = Math.round((correctCount / totalCount) * 100);

    if (correctPercentage < 60) {
      recommendations.push({
        type: 'performance',
        message: 'You might benefit from reviewing the core concepts in this subtopic.',
        action: 'Try reviewing the explanations and formulas before attempting more questions.'
      });
    } else if (correctPercentage >= 85) {
      recommendations.push({
        type: 'progression',
        message: 'Great job! You\'re showing strong mastery of this content.',
        action: 'You might be ready to move on to more challenging subtopics.'
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
    console.error('Error in adaptive feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}