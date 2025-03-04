// Fix for src/app/api/quantitative/complete-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/index';
import { 
  quantTestAttempts, 
  quantQuestionAttempts, 
  quantTopicProgress,
  quantSubtopics,
  quantSubtopicProgress
} from '@/db/quantitative-schema';
import { and, eq, sql } from 'drizzle-orm';

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
    
    // Get the singleton DB instance - make sure to await it
    const db = await getDb();
    
    // First, check if the test attempt exists
    // FIX: Use direct query syntax instead of prepared query
    const testAttemptResult = await db
      .select()
      .from(quantTestAttempts)
      .where(and(
        eq(quantTestAttempts.id, testSessionId),
        eq(quantTestAttempts.userId, userId)
      ))
      .limit(1);
    
    const testAttempt = testAttemptResult[0];

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
    const uniqueQuestionsResult = await db
      .select({
        count: sql<number>`count(DISTINCT ${quantQuestionAttempts.questionId})`
      })
      .from(quantQuestionAttempts)
      .where(eq(quantQuestionAttempts.testAttemptId, testSessionId));
    
    const totalQuestions = uniqueQuestionsResult[0]?.count || 0;

    // Get unique correct answers
    const correctAnswersResult = await db
      .select({
        count: sql<number>`count(DISTINCT ${quantQuestionAttempts.questionId}) filter (where ${quantQuestionAttempts.isCorrect} = true)`
      })
      .from(quantQuestionAttempts)
      .where(eq(quantQuestionAttempts.testAttemptId, testSessionId));
    
    const correctAnswers = correctAnswersResult[0]?.count || 0;
    
    // Get all attempts for detailed logging
    const allAttempts = await db
      .select({
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
    await db
      .update(quantTestAttempts)
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
      ));

    // NEW CODE: Update user progress for this topic and subtopic
    try {
      // Get topic ID for this subtopic
      const subtopicResult = await db
        .select({ topicId: quantSubtopics.topicId })
        .from(quantSubtopics)
        .where(eq(quantSubtopics.id, testAttempt.subtopicId))
        .limit(1);
      
      const subtopicInfo = subtopicResult[0];
      
      if (subtopicInfo) {
        const topicId = subtopicInfo.topicId;

        // Count UNIQUE correctly answered questions for this user and topic
        const uniqueCorrectQuestionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT qqa.question_id) 
          FROM "quantQuestionAttempts" qqa
          JOIN "quantTestAttempts" qta ON qqa.test_attempt_id = qta.id
          JOIN "quantQuestions" qq ON qqa.question_id = qq.id
          WHERE qta.user_id = ${userId}
          AND qq.topic_id = ${topicId}
          AND qqa.is_correct = true
        `);
        
        const uniqueCorrectQuestions = Number(uniqueCorrectQuestionsResult.rows[0]?.count) || 0;
        
        // Count UNIQUE attempted questions for this user and topic
        const uniqueAttemptedQuestionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT qqa.question_id) 
          FROM "quantQuestionAttempts" qqa
          JOIN "quantTestAttempts" qta ON qqa.test_attempt_id = qta.id
          JOIN "quantQuestions" qq ON qqa.question_id = qq.id
          WHERE qta.user_id = ${userId}
          AND qq.topic_id = ${topicId}
        `);
        
        const uniqueAttemptedQuestions = Number(uniqueAttemptedQuestionsResult.rows[0]?.count) || 0;
        
        // Count total questions in this topic for mastery level calculation
        const totalTopicQuestionsResult = await db.execute(sql`
          SELECT COUNT(*) FROM "quantQuestions"
          WHERE topic_id = ${topicId}
          AND is_active = true
        `);
        
        const totalTopicQuestions = Number(totalTopicQuestionsResult.rows[0]?.count) || 1;
        
        // Calculate mastery level as a percentage
        const masteryLevel = Math.round((uniqueCorrectQuestions / totalTopicQuestions) * 100);
        
        console.log('COMPLETE SESSION - Topic Progress Calculation:', {
          topicId,
          uniqueCorrectQuestions,
          uniqueAttemptedQuestions,
          totalTopicQuestions,
          masteryLevel
        });
        
        // Update or insert topic progress with CORRECT counts
        await db.transaction(async (tx) => {
          // Try to update existing progress
          const updateResult = await tx
            .update(quantTopicProgress)
            .set({
              questionsCorrect: uniqueCorrectQuestions,
              questionsAttempted: uniqueAttemptedQuestions,
              masteryLevel: masteryLevel,
              lastAttemptAt: new Date()
            })
            .where(and(
              eq(quantTopicProgress.userId, userId),
              eq(quantTopicProgress.topicId, topicId)
            ));
          
          // Check if rows were affected (simplified from original code)
          const rowsAffected = updateResult.rowCount || 0;
          
          // If no rows affected, insert a new progress record
          if (rowsAffected === 0) {
            await tx
              .insert(quantTopicProgress)
              .values({
                userId,
                topicId,
                questionsCorrect: uniqueCorrectQuestions,
                questionsAttempted: uniqueAttemptedQuestions,
                masteryLevel: masteryLevel,
                lastAttemptAt: new Date()
              });
          }
        });
        
        // Similarly, update subtopic progress
        const subtopicId = testAttempt.subtopicId;
        
        // Count unique correctly answered questions for this subtopic
        const uniqueCorrectSubtopicQuestionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT qqa.question_id) 
          FROM "quantQuestionAttempts" qqa
          JOIN "quantTestAttempts" qta ON qqa.test_attempt_id = qta.id
          JOIN "quantQuestions" qq ON qqa.question_id = qq.id
          WHERE qta.user_id = ${userId}
          AND qq.subtopic_id = ${subtopicId}
          AND qqa.is_correct = true
        `);
        
        const uniqueCorrectSubtopicQuestions = Number(uniqueCorrectSubtopicQuestionsResult.rows[0]?.count) || 0;
        
        // Count unique attempted questions for this subtopic
        const uniqueAttemptedSubtopicQuestionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT qqa.question_id) 
          FROM "quantQuestionAttempts" qqa
          JOIN "quantTestAttempts" qta ON qqa.test_attempt_id = qta.id
          JOIN "quantQuestions" qq ON qqa.question_id = qq.id
          WHERE qta.user_id = ${userId}
          AND qq.subtopic_id = ${subtopicId}
        `);
        
        const uniqueAttemptedSubtopicQuestions = Number(uniqueAttemptedSubtopicQuestionsResult.rows[0]?.count) || 0;
        
        // Count total questions in this subtopic
        const totalSubtopicQuestionsResult = await db.execute(sql`
          SELECT COUNT(*) FROM "quantQuestions"
          WHERE subtopic_id = ${subtopicId}
          AND is_active = true
        `);
        
        const totalSubtopicQuestions = Number(totalSubtopicQuestionsResult.rows[0]?.count) || 1;
        
        // Calculate subtopic mastery level
        const subtopicMasteryLevel = Math.round((uniqueCorrectSubtopicQuestions / totalSubtopicQuestions) * 100);
        
        // Update or insert subtopic progress
        await db.transaction(async (tx) => {
          const updateResult = await tx
            .update(quantSubtopicProgress)
            .set({
              questionsCorrect: uniqueCorrectSubtopicQuestions,
              questionsAttempted: uniqueAttemptedSubtopicQuestions,
              masteryLevel: subtopicMasteryLevel,
              lastAttemptAt: new Date()
            })
            .where(and(
              eq(quantSubtopicProgress.userId, userId),
              eq(quantSubtopicProgress.subtopicId, subtopicId)
            ));
          
          const rowsAffected = updateResult.rowCount || 0;
          
          if (rowsAffected === 0) {
            await tx
              .insert(quantSubtopicProgress)
              .values({
                userId,
                subtopicId,
                questionsCorrect: uniqueCorrectSubtopicQuestions,
                questionsAttempted: uniqueAttemptedSubtopicQuestions,
                masteryLevel: subtopicMasteryLevel,
                lastAttemptAt: new Date()
              });
          }
        });
        
        console.log('COMPLETE SESSION - Progress updated for topic and subtopic', {
          topicId,
          subtopicId,
          topicMastery: masteryLevel,
          subtopicMastery: subtopicMasteryLevel
        });
      }
    } catch (error) {
      console.error('Error updating topic/subtopic progress:', error);
      // Don't fail the whole request if progress update fails
    }

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