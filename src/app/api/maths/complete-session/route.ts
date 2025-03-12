// File: /src/app/api/maths/complete-session/route.ts
// Similar to quantitative but uses math-specific tables

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/index';
import { 
  mathTestAttempts, 
  mathQuestionAttempts, 
  mathTopicProgress,
  mathSubtopics,
  mathSubtopicProgress
} from '@/db/maths-schema';
import { and, eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testSessionId, userId } = body;
    
    console.log('COMPLETE MATH SESSION - Received request:', { 
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
    
    // Get the DB instance
    const db = await getDb();
    
    // Check if the test attempt exists
    const testAttemptResult = await db
      .select()
      .from(mathTestAttempts)
      .where(and(
        eq(mathTestAttempts.id, testSessionId),
        eq(mathTestAttempts.userId, userId)
      ))
      .limit(1);
    
    const testAttempt = testAttemptResult[0];

    if (!testAttempt) {
      console.error('COMPLETE MATH SESSION - Test session not found', { testSessionId, userId });
      return NextResponse.json(
        { error: "Math test session not found" },
        { status: 404 }
      );
    }

    // If the session is already completed, just return success
    if (testAttempt.status !== 'in_progress') {
      console.log('COMPLETE MATH SESSION - Session already completed', {
        testSessionId,
        currentStatus: testAttempt.status
      });
      return NextResponse.json({
        success: true,
        message: "Math test session was already completed",
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
    const uniqueQuestionsResult = await db
      .select({
        count: sql<number>`count(DISTINCT ${mathQuestionAttempts.questionId})`
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testSessionId));
    
    const totalQuestions = uniqueQuestionsResult[0]?.count || 0;

    // Get unique correct answers
    const correctAnswersResult = await db
      .select({
        count: sql<number>`count(DISTINCT ${mathQuestionAttempts.questionId}) filter (where ${mathQuestionAttempts.isCorrect} = true)`
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testSessionId));
    
    const correctAnswers = correctAnswersResult[0]?.count || 0;
    
    // Calculate score
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Update the test attempt to mark it as completed
    await db
      .update(mathTestAttempts)
      .set({
        status: 'completed',
        endTime,
        timeSpent: durationInSeconds,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        score: score
      })
      .where(and(
        eq(mathTestAttempts.id, testSessionId),
        eq(mathTestAttempts.userId, userId)
      ));
    
    // Similar update logic for updating topic and subtopic progress would go here
    // This would be similar to the quantitative version but use mathTopicProgress, etc.

    console.log('COMPLETE MATH SESSION - Final Update', {
      testSessionId,
      totalQuestions,
      correctAnswers,
      score,
      timeSpent: durationInSeconds
    });

    return NextResponse.json({
      success: true,
      message: "Math test session completed successfully",
      sessionStats: {
        testSessionId,
        totalQuestions,
        timeSpent: durationInSeconds,
        correctAnswers,
        score
      }
    });
    
  } catch (error) {
    console.error('COMPLETE MATH SESSION - Error completing test session:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: "Failed to complete math test session", details: errorMessage },
      { status: 500 }
    );
  }
}