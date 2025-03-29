// File: src/app/api/maths/complete-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/index';
import {
  mathTestAttempts,
  mathQuestionAttempts,
  mathTopicProgress,
  mathSubtopics,
  mathSubtopicProgress,
} from '@/db/maths-schema';
import { and, eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testAttemptId, userId } = body;

    const db = await getDb();

    console.log('COMPLETE MATH SESSION - Received request:', {
      testAttemptId,
      userId,
      timestamp: new Date().toISOString(),
    });

    if (!testAttemptId || !userId) {
      return NextResponse.json(
        { error: 'Both testAttemptId and userId are required' },
        { status: 400 }
      );
    }

    const testAttemptResult = await db
      .select()
      .from(mathTestAttempts)
      .where(and(
        eq(mathTestAttempts.id, testAttemptId),
        eq(mathTestAttempts.userId, userId)
      ))
      .limit(1);
    
    const testAttempt = testAttemptResult[0];

    if (!testAttempt) {
      console.error('COMPLETE MATH SESSION - Test session not found', { testAttemptId, userId });
      return NextResponse.json(
        { error: 'Test session not found' },
        { status: 404 }
      );
    }

    if (testAttempt.status !== 'in_progress') {
      console.log('COMPLETE MATH SESSION - Session already completed', {
        testAttemptId,
        currentStatus: testAttempt.status,
      });
      return NextResponse.json({
        success: true,
        message: 'Test session was already completed',
        sessionStats: {
          testAttemptId,
          totalQuestions: testAttempt.totalQuestions || 0,
          timeSpent: testAttempt.timeSpent || 0,
          score: testAttempt.score || 0,
        },
      });
    }

    const startTime = testAttempt.startTime;
    const endTime = new Date();
    const durationInSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    const uniqueQuestionsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${mathQuestionAttempts.questionId})`,
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testAttemptId));
    
    const totalQuestions = uniqueQuestionsResult[0]?.count || 0;

    const correctAnswersResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${mathQuestionAttempts.questionId}) FILTER (WHERE ${mathQuestionAttempts.isCorrect} = true)`,
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testAttemptId));
    
    const correctAnswers = correctAnswersResult[0]?.count || 0;

    const allAttempts = await db
      .select({
        questionId: mathQuestionAttempts.questionId,
        isCorrect: mathQuestionAttempts.isCorrect,
      })
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testAttemptId));

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    console.log('COMPLETE MATH SESSION - Detailed Attempt Breakdown', {
      testAttemptId,
      totalQuestions,
      correctAnswers,
      score,
      timeSpent: durationInSeconds,
      attempts: allAttempts.map(a => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
      })),
    });

    await db
      .update(mathTestAttempts)
      .set({
        status: 'completed',
        endTime,
        timeSpent: durationInSeconds,
        correctAnswers,
        totalQuestions,
        score,
      })
      .where(and(
        eq(mathTestAttempts.id, testAttemptId),
        eq(mathTestAttempts.userId, userId)
      ));

    try {
      const subtopicResult = await db
        .select({ topicId: mathSubtopics.topicId })
        .from(mathSubtopics)
        .where(eq(mathSubtopics.id, testAttempt.subtopicId))
        .limit(1);
      
      const subtopicInfo = subtopicResult[0];
      
      if (subtopicInfo) {
        const topicId = subtopicInfo.topicId;

        const uniqueCorrectQuestionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT qqa.question_id)
          FROM "mathQuestionAttempts" qqa
          JOIN "mathTestAttempts" qta ON qqa.test_attempt_id = qta.id
          JOIN "mathQuestions" qq ON qqa.question_id = qq.id
          WHERE qta.user_id = ${userId}
          AND qq.topic_id = ${topicId}
          AND qqa.is_correct = true
        `);
        
        const uniqueCorrectQuestions = Number(uniqueCorrectQuestionsResult.rows[0]?.count) || 0;
        
        const uniqueAttemptedQuestionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT qqa.question_id)
          FROM "mathQuestionAttempts" qqa
          JOIN "mathTestAttempts" qta ON qqa.test_attempt_id = qta.id
          JOIN "mathQuestions" qq ON qqa.question_id = qq.id
          WHERE qta.user_id = ${userId}
          AND qq.topic_id = ${topicId}
        `);
        
        const uniqueAttemptedQuestions = Number(uniqueAttemptedQuestionsResult.rows[0]?.count) || 0;
        
        const totalTopicQuestionsResult = await db.execute(sql`
          SELECT COUNT(*) FROM "mathQuestions"
          WHERE topic_id = ${topicId}
          AND is_active = true
        `);
        
        const totalTopicQuestions = Number(totalTopicQuestionsResult.rows[0]?.count) || 1;
        
        const masteryLevel = Math.round((uniqueCorrectQuestions / totalTopicQuestions) * 100);
        
        console.log('COMPLETE MATH SESSION - Topic Progress Calculation:', {
          topicId,
          uniqueCorrectQuestions,
          uniqueAttemptedQuestions,
          totalTopicQuestions,
          masteryLevel,
        });
        
        await db.transaction(async (tx) => {
          const updateResult = await tx
            .update(mathTopicProgress)
            .set({
              questionsCorrect: uniqueCorrectQuestions,
              questionsAttempted: uniqueAttemptedQuestions,
              masteryLevel,
              lastAttemptAt: new Date(),
            })
            .where(and(
              eq(mathTopicProgress.userId, userId),
              eq(mathTopicProgress.topicId, topicId)
            ));
          
          if (updateResult.rowCount === 0) {
            await tx
              .insert(mathTopicProgress)
              .values({
                userId,
                topicId,
                questionsCorrect: uniqueCorrectQuestions,
                questionsAttempted: uniqueAttemptedQuestions,
                masteryLevel,
                lastAttemptAt: new Date(),
              });
          }
        });

        const subtopicId = testAttempt.subtopicId;

        const uniqueCorrectSubtopicQuestionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT qqa.question_id)
          FROM "mathQuestionAttempts" qqa
          JOIN "mathTestAttempts" qta ON qqa.test_attempt_id = qta.id
          JOIN "mathQuestions" qq ON qqa.question_id = qq.id
          WHERE qta.user_id = ${userId}
          AND qq.subtopic_id = ${subtopicId}
          AND qqa.is_correct = true
        `);
        
        const uniqueCorrectSubtopicQuestions = Number(uniqueCorrectSubtopicQuestionsResult.rows[0]?.count) || 0;
        
        const uniqueAttemptedSubtopicQuestionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT qqa.question_id)
          FROM "mathQuestionAttempts" qqa
          JOIN "mathTestAttempts" qta ON qqa.test_attempt_id = qta.id
          JOIN "mathQuestions" qq ON qqa.question_id = qq.id
          WHERE qta.user_id = ${userId}
          AND qq.subtopic_id = ${subtopicId}
        `);
        
        const uniqueAttemptedSubtopicQuestions = Number(uniqueAttemptedSubtopicQuestionsResult.rows[0]?.count) || 0;
        
        const totalSubtopicQuestionsResult = await db.execute(sql`
          SELECT COUNT(*) FROM "mathQuestions"
          WHERE subtopic_id = ${subtopicId}
          AND is_active = true
        `);
        
        const totalSubtopicQuestions = Number(totalSubtopicQuestionsResult.rows[0]?.count) || 1;
        
        const subtopicMasteryLevel = Math.round((uniqueCorrectSubtopicQuestions / totalSubtopicQuestions) * 100);
        
        await db.transaction(async (tx) => {
          const updateResult = await tx
            .update(mathSubtopicProgress)
            .set({
              questionsCorrect: uniqueCorrectSubtopicQuestions,
              questionsAttempted: uniqueAttemptedSubtopicQuestions,
              masteryLevel: subtopicMasteryLevel,
              lastAttemptAt: new Date(),
            })
            .where(and(
              eq(mathSubtopicProgress.userId, userId),
              eq(mathSubtopicProgress.subtopicId, subtopicId)
            ));
          
          if (updateResult.rowCount === 0) {
            await tx
              .insert(mathSubtopicProgress)
              .values({
                userId,
                subtopicId,
                questionsCorrect: uniqueCorrectSubtopicQuestions,
                questionsAttempted: uniqueAttemptedSubtopicQuestions,
                masteryLevel: subtopicMasteryLevel,
                lastAttemptAt: new Date(),
              });
          }
        });

        console.log('COMPLETE MATH SESSION - Progress updated for topic and subtopic', {
          topicId,
          subtopicId,
          topicMastery: masteryLevel,
          subtopicMastery: subtopicMasteryLevel,
        });
      }
    } catch (error) {
      console.error('Error updating topic/subtopic progress:', error);
    }

    console.log('COMPLETE MATH SESSION - Final Update', {
      testAttemptId,
      totalQuestions,
      correctAnswers,
      score,
      timeSpent: durationInSeconds,
    });

    return NextResponse.json({
      success: true,
      message: 'Test session completed successfully',
      sessionStats: {
        testAttemptId,
        totalQuestions,
        timeSpent: durationInSeconds,
        correctAnswers,
        score,
      },
    });
  } catch (error) {
    console.error('COMPLETE MATH SESSION - Error completing test session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to complete test session', details: errorMessage },
      { status: 500 }
    );
  }
}