// src/app/api/maths/[topicId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { 
  mathTopics, 
  mathSubtopics,
  mathQuestions,
  mathTestAttempts,
  mathQuestionAttempts
} from '@/db/maths-schema';
import { and, eq, sql, count, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// Define types for the question data
interface QuestionRow {
  id: number;
  subtopicId: number;
  questionTypeId: number;
  difficultyLevelId: number;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  timeAllocation: number;
  formula: string;
  attemptCount: number;
  successRate: number;
  status?: string;
  correctOption?: string;
}

// Define a type for option objects
interface OptionItem {
  id?: string;
  text?: string;
  [key: string]: unknown;
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
    
    console.log("DETAILED MATH TOPIC FETCH - Request Details:", {
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
      db.query.mathTopics.findFirst({
        where: and(
          eq(mathTopics.id, topicIdNum),
          eq(mathTopics.isActive, true)
        )
      }),

      // Get subtopics for this topic
      db.select().from(mathSubtopics)
        .where(and(
          eq(mathSubtopics.topicId, topicIdNum),
          eq(mathSubtopics.isActive, true)
        ))
    ]);

    if (!topic) {
      console.log("Math topic not found for ID:", topicIdNum);
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    const MASTERY_THRESHOLD_PERCENT = 0.8; // 80%

    // Fetch all questions using Drizzle ORM, handling options as JSON
    const mqa = alias(mathQuestionAttempts, 'mqa');
    const mta = alias(mathTestAttempts, 'mta');

    const userAttemptsSubquery = db
      .select({
        questionId: mqa.questionId,
        attemptCount: count().as('attemptCount'),
        correctCount: sum(sql`CASE WHEN ${mqa.isCorrect} = true THEN 1 ELSE 0 END`).as('correctCount')
      })
      .from(mqa)
      .innerJoin(mta, eq(mqa.testAttemptId, mta.id))
      .where(and(
        eq(mta.userId, userId),
        
      ))
      .groupBy(mqa.questionId)
      .as('userAttempts');

    const questionsWithStats = await db
      .select({
        id: mathQuestions.id,
        subtopicId: mathQuestions.subtopicId,
        questionTypeId: mathQuestions.questionTypeId,
        difficultyLevelId: mathQuestions.difficultyLevelId,
        question: mathQuestions.question,
        options: mathQuestions.options,
        correctAnswer: mathQuestions.correctAnswer,
        explanation: mathQuestions.explanation,
        timeAllocation: mathQuestions.timeAllocation,
        formula: mathQuestions.formula,
        attemptCount: sql<number>`COALESCE(${userAttemptsSubquery.attemptCount}, 0)`.mapWith(Number),
        successRate: sql<number>`
          CASE 
            WHEN COALESCE(${userAttemptsSubquery.attemptCount}, 0) = 0 THEN 0
            ELSE COALESCE(${userAttemptsSubquery.correctCount}, 0) * 100.0 / COALESCE(${userAttemptsSubquery.attemptCount}, 0)
          END
        `.mapWith(Number)
      })
      .from(mathQuestions)
      .leftJoin(userAttemptsSubquery, eq(mathQuestions.id, userAttemptsSubquery.questionId))
      .where(and(
        eq(mathQuestions.topicId, topicIdNum),
        eq(mathQuestions.isActive, true)
      ))
      .orderBy(mathQuestions.id);

    // Proper type conversion with field validation, handling options as JSON
    const questions: QuestionRow[] = questionsWithStats.map(row => {
      let parsedOptions: { id: string; text: string }[] = [];

      // Handle options as JSON (from jsonb)
      if (row.options) {
        try {
          // If row.options is already an object or array, use it directly
          if (typeof row.options === 'string') {
            parsedOptions = JSON.parse(row.options || '[]');
          } else if (Array.isArray(row.options)) {
            parsedOptions = row.options;
          } else {
            // Attempt to stringify and parse if it's an unexpected object
            parsedOptions = JSON.parse(JSON.stringify(row.options) || '[]');
          }

          // Ensure options are in the correct format
          parsedOptions = parsedOptions.map((opt: OptionItem) => ({
            id: String(opt.id || `o${opt.text || String(opt)}`),
            text: String(opt.text || String(opt))
          }));
        } catch (e) {
          console.error('Error parsing options for question ID', row.id, ':', e, 'Raw options:', row.options);
          // Fallback: Use default options if parsing fails
          parsedOptions = [
            { id: "o1:Error", text: "Error loading options" },
            { id: "o2:Try again", text: "Try again" },
            { id: "o3:Contact support", text: "Contact support" },
            { id: "o4:Skip this question", text: "Skip this question" }
          ];
        }
      } else {
        // Fallback if options is null or undefined
        console.warn('Options is null/undefined for question ID', row.id);
        parsedOptions = [
          { id: "o1:Error", text: "Error loading options" },
          { id: "o2:Try again", text: "Try again" },
          { id: "o3:Contact support", text: "Contact support" },
          { id: "o4:Skip this question", text: "Skip this question" }
        ];
      }

      // Ensure exactly 4 options
      //if (parsedOptions.length !== 4) {
        parsedOptions = parsedOptions.map((opt, index) => ({
          id: `o${index + 1}:${opt.text}`,
          text: opt.text
        }));
      //}

      return {
        id: Number(row.id),
        subtopicId: Number(row.subtopicId),
        questionTypeId: Number(row.questionTypeId),
        difficultyLevelId: Number(row.difficultyLevelId),
        question: String(row.question || ''),
        options: parsedOptions,
        correctAnswer: String(row.correctAnswer || ''),
        explanation: String(row.explanation || ''),
        timeAllocation: Number(row.timeAllocation || 0),
        formula: String(row.formula || ''),
        attemptCount: Number(row.attemptCount || 0),
        successRate: Number(row.successRate || 0)
      };
    });

    console.log("MATH DETAILED QUESTION FETCH:", {
      totalQuestionsFound: questions.length,
      subtopicsCount: subtopics.length,
      questionDetails: questions.map((q) => ({
        id: q.id,
        subtopicId: q.subtopicId,
        attemptCount: q.attemptCount,
        successRate: q.successRate,
        optionsSample: q.options.slice(0, 2) // Log a sample of options for debugging
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
        const status = successRate >= MASTERY_THRESHOLD_PERCENT
          ? 'Mastered'
          : attemptCount > 0
            ? 'Learning'
            : 'To Start';
        
        return {
          ...q,
          status,
          correctOption: q.correctAnswer // Keep correctOption as correctAnswer for consistency
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
    const masteredCount = questions.filter((q) => q.successRate >= MASTERY_THRESHOLD_PERCENT).length;
    
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

    console.log("FINAL MATH TOPIC RESPONSE:", {
      topicName: topic.name,
      totalSubtopics: questionsBySubtopic.length,
      totalQuestions: stats.totalQuestions,
      questionsBySubtopic: questionsBySubtopic.map(s => ({
        subtopicName: s.name,
        totalQuestions: s.stats.total,
        sampleQuestionOptions: s.questions[0]?.options.slice(0, 2) // Log a sample of options for debugging
      }))
    });

    return NextResponse.json({
      topic,
      subtopics: questionsBySubtopic,
      stats
    });

  } catch (error: unknown) {
    console.error("CRITICAL UNEXPECTED ERROR - Fetching math topic data:", {
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
        error: "Failed to fetch math topic data", 
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
