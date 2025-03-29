// src/app/api/maths/adaptive-questions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  mathQuestionAttempts as MathQuestionAttempts, 
  mathTestAttempts as MathTestAttempts 
} from '@/db/maths-schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';
import { selectAdaptiveQuestions } from '@/lib/adaptive-learning';
import { adaptiveQuestionSelection } from '@/db/adaptive-schema';

export const dynamic = 'force-dynamic';

// Define types for options to improve type safety
type QuestionOption = { 
  id: string; 
  text: string; 
};

// Define a more specific type for raw options
type RawOption = 
  | { id: string; text: string } 
  | string 
  | number;

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
   
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    const data = await request.json();
    const { subtopicId, testAttemptId } = data;

    console.log('Adaptive Questions API - Request Details:', {
      userId,
      subtopicId,
      testAttemptId,
      timestamp: new Date().toISOString()
    });

    // Check if the schema is properly initialized
    console.log('Schema Status Check:', {
      adaptiveQuestionSelectionDefined: !!adaptiveQuestionSelection,
      tableDetails: adaptiveQuestionSelection ? JSON.stringify(adaptiveQuestionSelection) : 'undefined'
    });

    // Verify the adaptiveQuestionSelection table exists
    try {
      const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'adaptiveQuestionSelection'
        );
      `);
      console.log('adaptiveQuestionSelection table exists check:', tableCheck);
    } catch (tableCheckError) {
      console.error('Error checking if table exists:', tableCheckError);
    }

    if (!subtopicId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Get settings to check if adaptive learning is enabled
    const settings = await db.query.userAdaptiveSettings.findFirst({
      where: (settings, { eq }) => eq(settings.userId, userId)
    });

    const isAdaptiveLearningEnabled = settings?.enableAdaptiveLearning ?? true;

    // 2. Get subtopic info
    const subtopic = await db.query.mathSubtopics.findFirst({
      where: (subtopics, { eq }) => eq(subtopics.id, subtopicId)
    });

    if (!subtopic) {
      return NextResponse.json(
        { success: false, error: 'Subtopic not found' },
        { status: 404 }
      );
    }

    // 3. Get all questions for this subtopic
    const allQuestions = await db.query.mathQuestions.findMany({
      where: (questions, { eq, and }) => 
        and(
          eq(questions.subtopicId, subtopicId),
          eq(questions.isActive, true)
        )
    });

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions available for this subtopic' },
        { status: 404 }
      );
    }

    // 4. Process questions to match QuizQuestion format
    const formattedQuestions = allQuestions.map(question => {
      // Parse options (handle both string and array formats)
      let options: QuestionOption[] = [];
      
      try {
        const rawOptions: RawOption[] = typeof question.options === 'string' 
          ? JSON.parse(question.options) 
          : question.options;
        
        options = rawOptions.map((opt: RawOption, index: number): QuestionOption => {
          if (typeof opt === 'object' && opt !== null && 'id' in opt && 'text' in opt) {
            return { id: String(opt.id), text: String(opt.text) };
          }
          return { id: `o${index + 1}`, text: String(opt) };
        });
      } catch (e) {
        console.error('Error parsing options:', e);
        options = [];
      }

      return {
        id: question.id,
        subtopicId: question.subtopicId,
        question: question.question,
        options: options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        formula: question.formula || '',
        difficultyLevelId: question.difficultyLevelId,
        questionTypeId: question.questionTypeId,
        timeAllocation: question.timeAllocation,
        attemptCount: 0, // Will be filled from user data
        successRate: 0,   // Will be filled from user data
        status: 'To Start' // Default status
      };
    });

    // 5. Get user's test attempts for this subtopic
    const testAttempts = await db
      .select({ id: MathTestAttempts.id })
      .from(MathTestAttempts)
      .where(
        and(
          eq(MathTestAttempts.userId, userId),
          eq(MathTestAttempts.subtopicId, subtopicId)
        )
      );

    // 6. Get user's attempt history for these questions
    const attempts = testAttempts.length > 0 
      ? await db
          .select()
          .from(MathQuestionAttempts)
          .where(
            and(
              inArray(MathQuestionAttempts.testAttemptId, testAttempts.map(ta => ta.id)),
              inArray(MathQuestionAttempts.questionId, allQuestions.map(q => q.id))
            )
          )
      : [];

    // 7. Calculate attempt count and success rate for each question
    const questionStats = formattedQuestions.map(question => {
      const questionAttempts = attempts.filter(a => a.questionId === question.id);
      const attemptCount = questionAttempts.length;
      const correctCount = questionAttempts.filter(a => a.isCorrect).length;
      const successRate = attemptCount > 0 ? (correctCount / attemptCount) * 100 : 0;
      
      // Determine question status
      let status: 'Mastered' | 'Learning' | 'To Start' = 'To Start';
      if (attemptCount > 0) {
        status = successRate >= 75 ? 'Mastered' : 'Learning';
      }
      
      return {
        ...question,
        attemptCount,
        successRate,
        status
      };
    });

    // 8. Select questions adaptively if enabled, or randomly if not
    let selectedQuestions;
    console.log('Adaptive Question Selection - Session Details:', {
      userId,
      subtopicId,
      testAttemptId,
      isAdaptiveLearningEnabled,
      availableQuestionsCount: questionStats.length,
      timestamp: new Date().toISOString()
    });

    if (isAdaptiveLearningEnabled) {
      try {
        selectedQuestions = await selectAdaptiveQuestions(
          userId,
          subtopicId,
          questionStats,
          testAttemptId 
        );
        console.log('Adaptive selection completed successfully', {
          selectedCount: selectedQuestions.length
        });
        
        // If selectAdaptiveQuestions completed but table is still empty, try a direct insertion
        if (testAttemptId) {
          try {
            console.log('Attempting direct test insertion to adaptiveQuestionSelection');
            await db.insert(adaptiveQuestionSelection).values({
              testAttemptId,
              questionId: selectedQuestions[0].id,
              selectionReason: 'fallback_direct_test',
              difficultyLevel: selectedQuestions[0].difficultyLevelId,
              sequencePosition: 0
            });
            console.log('Direct test insertion successful');
          } catch (directInsertError) {
            console.error('Direct test insertion failed:', directInsertError);
            // Log detailed error information
            if (directInsertError instanceof Error) {
              console.error({
                errorType: directInsertError.constructor.name,
                message: directInsertError.message,
                stack: directInsertError.stack
              });
            }
          }
        }
      } catch (selectError) {
        console.error('Error in selectAdaptiveQuestions:', selectError);
        // Fall back to random selection if adaptive selection fails
        selectedQuestions = [...questionStats]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
      }
    } else {
      // Shuffle questions and select 10
      selectedQuestions = [...questionStats]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);
    }
    
    return NextResponse.json({
      success: true,
      subtopic: {
        id: subtopic.id,
        name: subtopic.name,
        description: subtopic.description
      },
      questions: selectedQuestions,
      isAdaptiveLearningEnabled
    });
  } catch (error) {
    console.error('Error in adaptive questions API:', error);
    // Log additional error details
    if (error instanceof Error) {
      console.error({
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}