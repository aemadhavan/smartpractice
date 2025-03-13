// File: src/app/api/maths/track-attempt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/index';
import { mathQuestionAttempts, mathTestAttempts } from '@/db/maths-schema';
import { and, eq, desc, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, questionId, subtopicId, isCorrect, userAnswer, timeSpent, testSessionId } = body;

    const db = await getDb();

    console.log('TRACKING MATH QUESTION ATTEMPT:', {
      testSessionId,
      userId,
      questionId,
      subtopicId,
      isCorrect,
      userAnswer,
      timeSpent,
      timestamp: new Date().toISOString(),
    });

    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!questionId) missingFields.push('questionId');
    if (!subtopicId) missingFields.push('subtopicId');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      );
    }

    const isCorrectBoolean = isCorrect === true;

    let testAttemptId = testSessionId;
    let existingTestAttempt;

    if (testAttemptId) {
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
        console.log('WARNING: Invalid test session ID provided:', testAttemptId);
        testAttemptId = null;
      }
    }

    if (!testAttemptId) {
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

      if (existingTestAttempt) {
        const attemptAge = Date.now() - existingTestAttempt.startTime.getTime();
        const oneHourInMs = 60 * 60 * 1000;
        
        if (attemptAge < oneHourInMs) {
          testAttemptId = existingTestAttempt.id;
          console.log('Using existing recent test session:', testAttemptId);
        }
      }
    }

    if (!testAttemptId) {
      const newTestAttempt = await db
        .insert(mathTestAttempts)
        .values({
          userId,
          subtopicId,
          startTime: new Date(),
          status: 'in_progress',
          totalQuestions: 0,
          correctAnswers: 0,
        })
        .returning({ id: mathTestAttempts.id });
      
      testAttemptId = newTestAttempt[0].id;
      console.log('Created new test session:', testAttemptId);
    }

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
      console.log('DUPLICATE QUESTION ATTEMPT BLOCKED', {
        testAttemptId,
        questionId,
      });
      return NextResponse.json({
        success: true,
        message: 'Question already attempted in this session',
        testAttemptId,
        alreadyAttempted: true,
      });
    }

    const newAttempt = await db
      .insert(mathQuestionAttempts)
      .values({
        testAttemptId,
        questionId,
        userAnswer: userAnswer || '',
        isCorrect: isCorrectBoolean,
        timeSpent: timeSpent || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const uniqueQuestionsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${mathQuestionAttempts.questionId})`,
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testAttemptId));
    
    const correctQuestionsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${mathQuestionAttempts.questionId}) FILTER (WHERE ${mathQuestionAttempts.isCorrect} = true)`,
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testAttemptId));

    const uniqueQuestionCount = uniqueQuestionsResult[0]?.count || 1;
    const correctQuestionCount = correctQuestionsResult[0]?.count || 0;

    const score = uniqueQuestionCount > 0
      ? Math.round((correctQuestionCount / uniqueQuestionCount) * 100)
      : 0;

    const updatedTestAttempt = await db
      .update(mathTestAttempts)
      .set({
        totalQuestions: uniqueQuestionCount,
        correctAnswers: correctQuestionCount,
        score: score,
        updatedAt: new Date(),
      })
      .where(eq(mathTestAttempts.id, testAttemptId))
      .returning();

    console.log('MATH QUESTION ATTEMPT TRACKED:', {
      testAttemptId,
      uniqueQuestionCount,
      correctQuestionCount,
      score,
      newAttemptDetails: {
        id: newAttempt[0]?.id,
        questionId,
        isCorrect: isCorrectBoolean,
      },
      updatedTestAttempt: updatedTestAttempt[0],
    });

    return NextResponse.json({
      success: true,
      message: 'Question attempt tracked successfully',
      testAttemptId,
      totalQuestions: uniqueQuestionCount,
      correctAnswers: correctQuestionCount,
      score: score,
    });
  } catch (error) {
    console.error('CRITICAL ERROR - Tracking math question attempt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to track question attempt', details: errorMessage },
      { status: 500 }
    );
  }
}