// src/app/api/quantitative/[topicId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { 
  quantTopics, 
  quantSubtopics
} from '@/db/quantitative-schema';
import { and, eq, sql } from 'drizzle-orm';

// Define types for the question data
interface QuestionRow {
  id: number;
  subtopicId: number;
  questionTypeId: number;
  difficultyLevelId: number;
  question: string;
  options: string;
  correctAnswer: string;
  explanation: string;
  timeAllocation: number;
  formula: string;
  attemptCount: number;
  successRate: number;
  status?: string; // Added for the mapped questions
  correctOption?: string; // Added for the mapped questions
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ topicId: string }> }
) {
  try {
    const params = await context.params;
    const topicIdNum = parseInt(params.topicId);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log("DETAILED TOPIC FETCH - Request Details:", {
      topicId: params.topicId,
      parsedTopicId: topicIdNum,
      userId
    });

    if (isNaN(topicIdNum)) {
      return NextResponse.json(
        { error: "Invalid topic ID" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Run queries in parallel
    const [topic, subtopics] = await Promise.all([
      // Get topic information
      db.query.quantTopics.findFirst({
        where: and(
          eq(quantTopics.id, topicIdNum),
          eq(quantTopics.isActive, true)
        )
      }),

      // Get subtopics for this topic
      db.select().from(quantSubtopics)
        .where(and(
          eq(quantSubtopics.topicId, topicIdNum),
          eq(quantSubtopics.isActive, true)
        ))
    ]);

    if (!topic) {
      console.log("Topic not found for ID:", topicIdNum);
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Fetch all questions using raw SQL to avoid parameter type issues
    const questionsQuery = await db.execute(sql`
      SELECT 
        q.id,
        q.subtopic_id AS "subtopicId",
        q.question_type_id AS "questionTypeId",
        q.difficulty_level_id AS "difficultyLevelId",
        q.question,
        q.options,
        q.correct_answer AS "correctAnswer",
        q.explanation,
        q.time_allocation AS "timeAllocation",
        q.formula,
        COALESCE((
          SELECT COUNT(*) 
          FROM "quantQuestionAttempts" qqa
          JOIN "quantTestAttempts" qta ON qqa.test_attempt_id = qta.id
          WHERE qqa.question_id = q.id 
          AND qta.user_id = ${userId}
        ), 0) AS "attemptCount",
        COALESCE((
          SELECT CAST(
            SUM(CASE WHEN qqa.is_correct = true THEN 1.0 ELSE 0.0 END) / 
            NULLIF(COUNT(*), 0) 
            AS FLOAT
          )
          FROM "quantQuestionAttempts" qqa
          JOIN "quantTestAttempts" qta ON qqa.test_attempt_id = qta.id
          WHERE qqa.question_id = q.id 
          AND qta.user_id = ${userId}
        ), 0.0) AS "successRate"
      FROM "quantQuestions" q
      WHERE q.topic_id = ${topicIdNum}
      AND q.is_active = true
      ORDER BY q.id
    `);

    // Proper type conversion with field validation
    const questions: QuestionRow[] = questionsQuery.rows.map(row => ({
      id: Number(row.id),
      subtopicId: Number(row.subtopicId),
      questionTypeId: Number(row.questionTypeId),
      difficultyLevelId: Number(row.difficultyLevelId),
      question: String(row.question),
      options: String(row.options),
      correctAnswer: String(row.correctAnswer),
      explanation: String(row.explanation),
      timeAllocation: Number(row.timeAllocation),
      formula: String(row.formula),
      attemptCount: Number(row.attemptCount),
      successRate: Number(row.successRate)
    }));

    console.log("DETAILED QUESTION FETCH:", {
      totalQuestionsFound: questions.length,
      subtopicsCount: subtopics.length,
      questionDetails: questions.map((q) => ({
        id: q.id,
        subtopicId: q.subtopicId,
        attemptCount: q.attemptCount,
        successRate: q.successRate
      }))
    });

    // Group questions by subtopic
    const questionsBySubtopic = subtopics.map(subtopic => {
      const subtopicQuestions = questions.filter((q) => q.subtopicId === subtopic.id);
      
      // Map questions with status calculation
      const mappedQuestions = subtopicQuestions.map((q) => {
        const successRate = q.successRate;
        const attemptCount = q.attemptCount;
        
        // Determine status
        const status = successRate >= 0.8 
          ? 'Mastered' 
          : attemptCount > 0 
            ? 'Learning' 
            : 'To Start';
        
        return {
          ...q,
          status,
          correctOption: q.correctAnswer
        };
      });
      
      // Calculate subtopic stats
      const masteredCount = mappedQuestions.filter((q) => q.status === 'Mastered').length;
      const learningCount = mappedQuestions.filter((q) => q.status === 'Learning').length;
      const toStartCount = mappedQuestions.filter((q) => q.status === 'To Start').length;
      
      return {
        id: subtopic.id,
        name: subtopic.name,
        description: subtopic.description,
        questions: mappedQuestions,
        stats: {
          total: mappedQuestions.length,
          mastered: masteredCount,
          learning: learningCount,
          toStart: toStartCount
        }
      };
    });

    // Calculate overall statistics
    const totalQuestions = questions.length;
    const attemptedCount = questions.filter((q) => q.attemptCount > 0).length;
    const masteredCount = questions.filter((q) => q.successRate >= 0.8).length;
    
    // Calculate mastery level as percentage of mastered questions over total questions
    const masteryLevel = totalQuestions > 0
      ? Math.round((masteredCount / totalQuestions) * 100)
      : 0;

    const stats = {
      totalQuestions,
      attemptedCount,
      masteredCount,
      masteryLevel
    };

    console.log("FINAL TOPIC RESPONSE:", {
      topicName: topic.name,
      totalSubtopics: questionsBySubtopic.length,
      totalQuestions: stats.totalQuestions,
      questionsBySubtopic: questionsBySubtopic.map(s => ({
        subtopicName: s.name,
        totalQuestions: s.stats.total
      }))
    });

    return NextResponse.json({
      topic,
      subtopics: questionsBySubtopic,
      stats
    });

  } catch (error: unknown) {
    console.error("CRITICAL UNEXPECTED ERROR - Fetching topic data:", {
      error,
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: "Failed to fetch topic data", 
        details: errorMessage,
        fullError: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : {}
      },
      { status: 500 }
    );
  }
}