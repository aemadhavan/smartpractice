// File: /src/app/api/maths/track-attempt/route.ts
// Similar to quantitative but uses math-specific tables

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/index';
import { 
  mathQuestionAttempts,
  mathTestAttempts
} from '@/db/maths-schema';
import { and, eq, desc, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, questionId, topicId, subtopicId, isCorrect, userAnswer, timeSpent, testSessionId } = body;

    // Get the singleton DB instance
    const db = await getDb();
    
    console.log('MATH ATTEMPT TRACKING:', {
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

    // Find or create a unique test attempt for this session
    let testAttemptId = testSessionId;
    let existingTestAttempt;

    // If testSessionId is provided, verify it exists and is valid
    if (testAttemptId) {
      console.log('Verifying provided math test session ID:', testAttemptId);
      
      const existingAttemptResult = await db
        .select()
        .from(mathTestAttempts)
        .where(and(
          eq(mathTestAttempts.id, testAttemptId),
          eq(mathTestAttempts.userId, userId),
          eq(mathTestAttempts.status, 'in_progress')
        ))
        .limit(1);
      
      existingTestAttempt = existingAttemptResult[0];
      
      if (!existingTestAttempt) {
        console.log('WARNING: Invalid math test session ID provided:', testSessionId);
        testAttemptId = null;
      } else {
        console.log('Valid math test session ID confirmed:', testSessionId);
      }
    }

    // If no valid testSessionId, find or create a new session
    if (!testAttemptId) {
      // Look for an existing in-progress session within the last hour
      const existingAttemptResult = await db
        .select()
        .from(mathTestAttempts)
        .where(and(
          eq(mathTestAttempts.userId, userId),
          eq(mathTestAttempts.subtopicId, subtopicId),
          eq(mathTestAttempts.status, 'in_progress')
        ))
        .orderBy(desc(mathTestAttempts.startTime))
        .limit(1);
      
      existingTestAttempt = existingAttemptResult[0];

      // If an existing session exists and is recent, use its ID
      if (existingTestAttempt) {
        const attemptAge = Date.now() - existingTestAttempt.startTime.getTime();
        const oneHourInMs = 60 * 60 * 1000;
        
        if (attemptAge < oneHourInMs) {
          testAttemptId = existingTestAttempt.id;
          console.log('Using existing recent math test session:', testAttemptId);
        }
      }
    }

    // If still no test attempt ID, create a new one
    if (!testAttemptId) {
      console.log('Creating new math test session for user', userId, 'and subtopic', subtopicId);
      
      const newTestAttempt = await db
        .insert(mathTestAttempts)
        .values({
          userId,
          subtopicId,
          startTime: new Date(),
          status: 'in_progress',
          totalQuestions: 0,
          correctAnswers: 0
        })
        .returning({ id: mathTestAttempts.id });
      
      testAttemptId = newTestAttempt[0].id;
      console.log('Created new math test session:', testAttemptId);
    }

    // Check for duplicate question attempt in this session
    const existingQuestionAttemptResult = await db
      .select()
      .from(mathQuestionAttempts)
      .where(and(
        eq(mathQuestionAttempts.testAttemptId, testAttemptId),
        eq(mathQuestionAttempts.questionId, questionId)
      ))
      .limit(1);
    
    const existingQuestionAttempt = existingQuestionAttemptResult[0];
    
    if (existingQuestionAttempt) {
      console.log('DUPLICATE MATH QUESTION ATTEMPT BLOCKED', {
        testAttemptId,
        questionId
      });
      return NextResponse.json({ 
        success: true,
        message: "Math question already attempted in this session",
        testAttemptId,
        alreadyAttempted: true
      });
    }

    // Record the question attempt
    const newAttempt = await db
      .insert(mathQuestionAttempts)
      .values({
        testAttemptId,
        questionId,
        userAnswer: userAnswer || '',
        isCorrect: isCorrectBoolean,
        timeSpent: timeSpent || 0
      })
      .returning();

    // Calculate unique questions and correct answers
    const uniqueQuestionsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${mathQuestionAttempts.questionId})`
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testAttemptId));
    
    const correctQuestionsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${mathQuestionAttempts.questionId}) FILTER (WHERE ${mathQuestionAttempts.isCorrect} = true)`
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testAttemptId));

    const uniqueQuestionCount = uniqueQuestionsResult[0]?.count || 1;
    const correctQuestionCount = correctQuestionsResult[0]?.count || 0;

    // Calculate score
    const score = uniqueQuestionCount > 0 
      ? Math.round((correctQuestionCount / uniqueQuestionCount) * 100) 
      : 0;

    // Update test attempt with current stats
    const updatedTestAttempt = await db
      .update(mathTestAttempts)
      .set({
        totalQuestions: uniqueQuestionCount,
        correctAnswers: correctQuestionCount,
        score: score
      })
      .where(eq(mathTestAttempts.id, testAttemptId))
      .returning();

    console.log('MATH TEST TRACKING RESULTS:', {
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
      message: "Math attempt recorded successfully",
      testAttemptId,
      totalQuestions: uniqueQuestionCount,
      correctAnswers: correctQuestionCount,
      score: score
    });
    
  } catch (error) {
    console.error('CRITICAL ERROR - Tracking math question attempt:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: "Failed to track math question attempt", details: errorMessage },
      { status: 500 }
    );
  }
}
