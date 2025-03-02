//File: src/app/api/quantitative/track-attempt/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/index';
import { 
  quantQuestionAttempts,
  quantTestAttempts
} from '@/db/quantitative-schema';
import { and, eq, desc, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, questionId, topicId, subtopicId, isCorrect, userAnswer, timeSpent, testSessionId } = body;

    // Get the singleton DB instance
    const db = getDb();
    
    console.log('UNIFIED SESSION TRACKING:', {
      userId,
      questionId,
      topicId,
      subtopicId,
      isCorrect,
      testSessionId,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!questionId) missingFields.push('questionId');
    if (!topicId) missingFields.push('topicId');
    if (!subtopicId) missingFields.push('subtopicId');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: "Missing required fields", missingFields },
        { status: 400 }
      );
    }

    // Ensure isCorrect is a boolean
    const isCorrectBoolean = isCorrect === true;

    // 1. Find or create a unique test attempt for this session
    let testAttemptId = testSessionId;
    let existingTestAttempt;

    // If testSessionId is provided, verify it exists and is valid
    if (testAttemptId) {
      console.log('Verifying provided test session ID:', testAttemptId);
      
      existingTestAttempt = await db.query.quantTestAttempts.findFirst({
        where: and(
          eq(quantTestAttempts.id, testAttemptId),
          eq(quantTestAttempts.userId, userId),
          eq(quantTestAttempts.status, 'in_progress')
        )
      });
      
      // If the provided session ID is not valid, log this and reset it to null
      if (!existingTestAttempt) {
        console.log('WARNING: Invalid test session ID provided:', testSessionId);
        testAttemptId = null;
      } else {
        console.log('Valid test session ID confirmed:', testSessionId);
      }
    }

    // If no valid testSessionId, find or create a new session
    if (!testAttemptId) {
      // Look for an existing in-progress session within the last hour
      existingTestAttempt = await db.query.quantTestAttempts.findFirst({
        where: and(
          eq(quantTestAttempts.userId, userId),
          eq(quantTestAttempts.subtopicId, subtopicId),
          eq(quantTestAttempts.status, 'in_progress')
        ),
        orderBy: [desc(quantTestAttempts.startTime)]
      });

      // If an existing session exists and is recent, use its ID
      if (existingTestAttempt) {
        const attemptAge = Date.now() - existingTestAttempt.startTime.getTime();
        const oneHourInMs = 60 * 60 * 1000;
        
        if (attemptAge < oneHourInMs) {
          testAttemptId = existingTestAttempt.id;
          console.log('Using existing recent test session:', testAttemptId);
        }
      }
    }

    // If still no test attempt ID, create a new one
    if (!testAttemptId) {
      console.log('Creating new test session for user', userId, 'and subtopic', subtopicId);
      
      const newTestAttempt = await db.insert(quantTestAttempts).values({
        userId,
        subtopicId,
        startTime: new Date(),
        status: 'in_progress',
        totalQuestions: 0,
        correctAnswers: 0
      }).returning({ id: quantTestAttempts.id });
      
      testAttemptId = newTestAttempt[0].id;
      console.log('Created new test session:', testAttemptId);
    }

    // 2. Check for duplicate question attempt in this session
    const existingQuestionAttempt = await db.query.quantQuestionAttempts.findFirst({
      where: and(
        eq(quantQuestionAttempts.testAttemptId, testAttemptId),
        eq(quantQuestionAttempts.questionId, questionId)
      )
    });
    
    if (existingQuestionAttempt) {
      console.log('DUPLICATE QUESTION ATTEMPT BLOCKED', {
        testAttemptId,
        questionId
      });
      return NextResponse.json({ 
        success: true,
        message: "Question already attempted in this session",
        testAttemptId,
        alreadyAttempted: true
      });
    }

    // 3. Record the question attempt
    const newAttempt = await db.insert(quantQuestionAttempts).values({
      testAttemptId,
      questionId,
      userAnswer: userAnswer || '',
      isCorrect: isCorrectBoolean,
      timeSpent: timeSpent || 0
    }).returning();

    // 4. Calculate unique questions and correct answers
    const uniqueQuestionsResult = await db.select({
      count: sql<number>`COUNT(DISTINCT ${quantQuestionAttempts.questionId})`
    })
    .from(quantQuestionAttempts)
    .where(eq(quantQuestionAttempts.testAttemptId, testAttemptId));
    
    const correctQuestionsResult = await db.select({
      count: sql<number>`COUNT(DISTINCT ${quantQuestionAttempts.questionId}) FILTER (WHERE ${quantQuestionAttempts.isCorrect} = true)`
    })
    .from(quantQuestionAttempts)
    .where(eq(quantQuestionAttempts.testAttemptId, testAttemptId));

    const uniqueQuestionCount = uniqueQuestionsResult[0]?.count || 1;
    const correctQuestionCount = correctQuestionsResult[0]?.count || 0;

    // 5. Calculate score
    const score = uniqueQuestionCount > 0 
      ? Math.round((correctQuestionCount / uniqueQuestionCount) * 100) 
      : 0;

    // 6. Update test attempt with current stats
    const updatedTestAttempt = await db.update(quantTestAttempts)
      .set({
        totalQuestions: uniqueQuestionCount,
        correctAnswers: correctQuestionCount,
        score: score
      })
      .where(eq(quantTestAttempts.id, testAttemptId))
      .returning();

    console.log('UNIFIED SESSION TRACKING RESULTS:', {
      testAttemptId,
      uniqueQuestionCount,
      correctQuestionCount,
      score,
      newAttemptDetails: {
        id: newAttempt[0]?.id,
        questionId,
        isCorrect: isCorrectBoolean
      },
      updatedTestAttempt: updatedTestAttempt[0]
    });

    return NextResponse.json({ 
      success: true,
      message: "Attempt recorded successfully",
      testAttemptId,
      totalQuestions: uniqueQuestionCount,
      correctAnswers: correctQuestionCount,
      score: score
    });
    
  } catch (error) {
    console.error('CRITICAL ERROR - Tracking question attempt:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: "Failed to track question attempt", details: errorMessage },
      { status: 500 }
    );
  }
}