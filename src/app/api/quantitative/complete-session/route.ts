//File: src/app/api/quantitative/complete-session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { quantTestAttempts, quantQuestionAttempts } from '@/db/quantitative-schema';
import { and, eq, count, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testSessionId, userId } = body;
    
    // Enhanced logging
    console.log('COMPLETE SESSION - Received request:', { 
      testSessionId, 
      userId, 
      timestamp: new Date().toISOString() 
    });
    
    // Validate required fields
    if (!testSessionId || !userId) {
      return NextResponse.json(
        { error: "Both testSessionId and userId are required" },
        { status: 400 }
      );
    }

    // First, check if the test attempt exists
    const testAttempt = await db.query.quantTestAttempts.findFirst({
      where: and(
        eq(quantTestAttempts.id, testSessionId),
        eq(quantTestAttempts.userId, userId)
      )
    });

    if (!testAttempt) {
      console.error('COMPLETE SESSION - Test session not found', { testSessionId, userId });
      return NextResponse.json(
        { error: "Test session not found" },
        { status: 404 }
      );
    }

    // If the session is already completed, just return success
    if (testAttempt.status !== 'in_progress') {
      console.log('COMPLETE SESSION - Session already completed', {
        testSessionId,
        currentStatus: testAttempt.status
      });
      return NextResponse.json({
        success: true,
        message: "Test session was already completed",
        sessionStats: {
          testSessionId,
          totalQuestions: testAttempt.totalQuestions || 0,
          timeSpent: testAttempt.timeSpent || 0,
          score: testAttempt.score || 0
        }
      });
    }

    // Calculate session duration
    const startTime = testAttempt.startTime;
    const endTime = new Date();
    const durationInSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Get all unique questions attempted in this session
    const uniqueQuestionsResult = await db.select({
      count: sql<number>`count(DISTINCT ${quantQuestionAttempts.questionId})`
    })
    .from(quantQuestionAttempts)
    .where(eq(quantQuestionAttempts.testAttemptId, testSessionId));
    
    const totalQuestions = uniqueQuestionsResult[0]?.count || 0;

    // Get unique correct answers
    const correctAnswersResult = await db.select({
      count: sql<number>`count(DISTINCT ${quantQuestionAttempts.questionId}) filter (where ${quantQuestionAttempts.isCorrect} = true)`
    })
    .from(quantQuestionAttempts)
    .where(eq(quantQuestionAttempts.testAttemptId, testSessionId));
    
    const correctAnswers = correctAnswersResult[0]?.count || 0;
    
    // Get all attempts for detailed logging
    const allAttempts = await db.select({
      questionId: quantQuestionAttempts.questionId,
      isCorrect: quantQuestionAttempts.isCorrect
    })
    .from(quantQuestionAttempts)
    .where(eq(quantQuestionAttempts.testAttemptId, testSessionId));

    // Calculate score based on the actual questions attempted
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Detailed logging of attempts
    console.log('COMPLETE SESSION - Detailed Attempt Breakdown', {
      testSessionId,
      totalQuestions,
      correctAnswers,
      score,
      timeSpent: durationInSeconds,
      attempts: allAttempts.map(a => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect
      }))
    });

    // Update the test attempt to mark it as completed with most recent stats
    const updatedTestAttempt = await db.update(quantTestAttempts)
      .set({
        status: 'completed',
        endTime,
        timeSpent: durationInSeconds,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions, // Use the exact count from unique question attempts
        score: score
      })
      .where(and(
        eq(quantTestAttempts.id, testSessionId),
        eq(quantTestAttempts.userId, userId)
      ))
      .returning();

    console.log('COMPLETE SESSION - Final Update', {
      testSessionId,
      totalQuestions,
      correctAnswers,
      score,
      timeSpent: durationInSeconds
    });

    return NextResponse.json({
      success: true,
      message: "Test session completed successfully",
      sessionStats: {
        testSessionId,
        totalQuestions,
        timeSpent: durationInSeconds,
        correctAnswers,
        score
      }
    });
    
  } catch (error) {
    console.error('COMPLETE SESSION - Error completing test session:', error);
    
    // Safely extract error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: "Failed to complete test session", details: errorMessage },
      { status: 500 }
    );
  }
}