// File: src/app/api/quantitative/[topicId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { 
  quantTopics, 
  quantQuestions,
  quantSubtopics,
  quantQuestionAttempts,
  quantTopicProgress
} from '@/db/quantitative-schema';
import { and, eq, sql } from 'drizzle-orm';

type Params = { params: { topicId: string } };

export async function GET(
  request: NextRequest,
  context: Params
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const topicId = parseInt(context.params.topicId);

    if (isNaN(topicId)) {
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

    // Get topic information
    const topic = await db.query.quantTopics.findFirst({
      where: and(
        eq(quantTopics.id, topicId),
        eq(quantTopics.isActive, true)
      )
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Get subtopics for this topic
    const subtopics = await db.select().from(quantSubtopics)
      .where(and(
        eq(quantSubtopics.topicId, topicId),
        eq(quantSubtopics.isActive, true)
      ));
    
    // Get questions with their user attempt information
    const questions = await db
      .select({
        id: quantQuestions.id,
        subtopicId: quantQuestions.subtopicId,
        questionTypeId: quantQuestions.questionTypeId,
        difficultyLevelId: quantQuestions.difficultyLevelId,
        question: quantQuestions.question,
        options: quantQuestions.options,
        timeAllocation: quantQuestions.timeAllocation,
        formula: quantQuestions.formula,
        // Get the count of attempts by this user for this question
        attemptCount: sql<number>`count(${quantQuestionAttempts.id})`,
        // Calculate success rate
        successRate: sql<number>`CASE WHEN count(${quantQuestionAttempts.id}) > 0 
                                THEN sum(CASE WHEN ${quantQuestionAttempts.isCorrect} = true THEN 1 ELSE 0 END)::float / count(${quantQuestionAttempts.id})
                                ELSE 0 END`
      })
      .from(quantQuestions)
      .leftJoin(
        quantQuestionAttempts,
        and(
          eq(quantQuestionAttempts.questionId, quantQuestions.id),
          eq(quantQuestionAttempts.isCorrect, true)
        )
      )
      .where(and(
        eq(quantQuestions.topicId, topicId),
        eq(quantQuestions.isActive, true)
      ))
      .groupBy(quantQuestions.id)
      .orderBy(quantQuestions.id);

    // Get user progress for this topic
    const userProgress = await db.query.quantTopicProgress.findFirst({
      where: and(
        eq(quantTopicProgress.topicId, topicId),
        eq(quantTopicProgress.userId, userId)
      )
    });

    // Calculate overall statistics
    const stats = {
      totalQuestions: questions.length,
      attemptedCount: questions.filter(q => q.attemptCount > 0).length,
      masteredCount: questions.filter(q => q.successRate >= 0.8).length,
      masteryLevel: userProgress?.masteryLevel || 0,
      questionsAttempted: userProgress?.questionsAttempted || 0,
      questionsCorrect: userProgress?.questionsCorrect || 0,
      lastAttemptAt: userProgress?.lastAttemptAt
    };

    // Group questions by subtopic
    const questionsBySubtopic = subtopics.map(subtopic => {
      const subtopicQuestions = questions.filter(q => q.subtopicId === subtopic.id);
      return {
        id: subtopic.id,
        name: subtopic.name,
        description: subtopic.description,
        questions: subtopicQuestions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          difficultyLevelId: q.difficultyLevelId,
          questionTypeId: q.questionTypeId,
          timeAllocation: q.timeAllocation,
          formula: q.formula,
          attemptCount: q.attemptCount,
          successRate: q.successRate,
          status: q.successRate >= 0.8 ? 'Mastered' 
                : q.attemptCount > 0 ? 'Learning' 
                : 'To Start'
        })),
        stats: {
          total: subtopicQuestions.length,
          mastered: subtopicQuestions.filter(q => q.successRate >= 0.8).length,
          learning: subtopicQuestions.filter(q => q.attemptCount > 0 && q.successRate < 0.8).length,
          toStart: subtopicQuestions.filter(q => q.attemptCount === 0).length
        }
      };
    });

    return NextResponse.json({
      topic,
      subtopics: questionsBySubtopic,
      stats
    });

  } catch (error) {
    console.error("Error fetching topic data:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic data" },
      { status: 500 }
    );
  }
}