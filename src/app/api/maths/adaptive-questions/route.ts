// src/app/api/maths/adaptive-questions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  mathQuestionAttempts as MathQuestionAttempts, 
  mathTestAttempts as MathTestAttempts 
} from '@/db/maths-schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';
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

// Define types for database records
interface TestAttempt {
  id: number;
}

interface QuestionAttempt {
  testAttemptId: number;
  questionId: number;
  isCorrect: boolean;
  // Add other fields as needed
}

export async function POST(request: NextRequest) {
  let currentStep = 'initializing';
  
  try {
    console.log('Adaptive Questions API - Request received');
    currentStep = 'authenticating user';
    
    const user = await currentUser();
    if (!user) {
      console.log('Authentication failed - no user found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log('User authenticated:', userId);

    // Parse request body with try/catch
    currentStep = 'parsing request data';
    let data;
    try {
      data = await request.json();
      console.log('Request data parsed successfully:', data);
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { subtopicId, testAttemptId } = data;
    console.log('Adaptive Questions API - Request Details:', {
      userId,
      subtopicId,
      testAttemptId,
      timestamp: new Date().toISOString()
    });

    // Validate required parameters
    if (!subtopicId) {
      console.log('Missing subtopicId in request');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if we can connect to the database
    currentStep = 'checking database connection';
    try {
      // Simple query to test database connection
      const dbConnectionTest = await db.execute(sql`SELECT 1 as connection_test`);
      console.log('Database connection successful:', dbConnectionTest);
    } catch (dbConnectionError) {
      console.error('Database connection error:', dbConnectionError);
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Check if the schema is properly initialized
    currentStep = 'checking schema';
    console.log('Schema Status Check:', {
      adaptiveQuestionSelectionDefined: !!adaptiveQuestionSelection,
      tableDetails: adaptiveQuestionSelection ? JSON.stringify(Object.keys(adaptiveQuestionSelection)) : 'undefined'
    });

    // 1. Get settings to check if adaptive learning is enabled
    currentStep = 'retrieving user settings';
    let settings;
    try {
      settings = await db.query.userAdaptiveSettings.findFirst({
        where: (settings, { eq }) => eq(settings.userId, userId)
      });
      console.log('User settings retrieved:', settings ? 'found' : 'not found');
    } catch (settingsError) {
      console.error('Error retrieving user settings:', settingsError);
      return NextResponse.json(
        { success: false, error: 'Error retrieving user settings' },
        { status: 500 }
      );
    }

    const isAdaptiveLearningEnabled = settings?.enableAdaptiveLearning ?? true;

    // 2. Get subtopic info
    currentStep = 'retrieving subtopic info';
    let subtopic;
    try {
      subtopic = await db.query.mathSubtopics.findFirst({
        where: (subtopics, { eq }) => eq(subtopics.id, subtopicId)
      });
      console.log('Subtopic info retrieved:', subtopic ? subtopic.name : 'not found');
    } catch (subtopicError) {
      console.error('Error retrieving subtopic:', subtopicError);
      return NextResponse.json(
        { success: false, error: 'Error retrieving subtopic information' },
        { status: 500 }
      );
    }

    if (!subtopic) {
      return NextResponse.json(
        { success: false, error: 'Subtopic not found' },
        { status: 404 }
      );
    }

    // 3. Get all questions for this subtopic
    currentStep = 'retrieving questions';
    let allQuestions;
    try {
      allQuestions = await db.query.mathQuestions.findMany({
        where: (questions, { eq, and }) => 
          and(
            eq(questions.subtopicId, subtopicId),
            eq(questions.isActive, true)
          )
      });
      console.log(`Retrieved ${allQuestions.length} questions for subtopic`);
    } catch (questionsError) {
      console.error('Error retrieving questions:', questionsError);
      return NextResponse.json(
        { success: false, error: 'Error retrieving questions' },
        { status: 500 }
      );
    }

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions available for this subtopic' },
        { status: 404 }
      );
    }

    // 4. Process questions to match QuizQuestion format
    currentStep = 'processing questions';
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
        console.error(`Error parsing options for question ${question.id}:`, e);
        // Create default options if parsing fails
        options = [
          { id: 'o1', text: 'Option 1' },
          { id: 'o2', text: 'Option 2' },
          { id: 'o3', text: 'Option 3' },
          { id: 'o4', text: 'Option 4' }
        ];
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
    currentStep = 'retrieving test attempts';
    let testAttempts: TestAttempt[] = [];
    try {
      testAttempts = await db
        .select({ id: MathTestAttempts.id })
        .from(MathTestAttempts)
        .where(
          and(
            eq(MathTestAttempts.userId, userId),
            eq(MathTestAttempts.subtopicId, subtopicId)
          )
        );
      console.log(`Retrieved ${testAttempts.length} test attempts for user`);
    } catch (testAttemptsError) {
      console.error('Error retrieving test attempts:', testAttemptsError);
      // Continue without test attempts data - non-critical
    }

    // 6. Get user's attempt history for these questions
    currentStep = 'retrieving question attempts';
    let attempts: QuestionAttempt[] = [];
    if (testAttempts.length > 0) {
      try {
        attempts = await db
          .select()
          .from(MathQuestionAttempts)
          .where(
            and(
              inArray(MathQuestionAttempts.testAttemptId, testAttempts.map(ta => ta.id)),
              inArray(MathQuestionAttempts.questionId, allQuestions.map(q => q.id))
            )
          );
        console.log(`Retrieved ${attempts.length} question attempts`);
      } catch (attemptsError) {
        console.error('Error retrieving question attempts:', attemptsError);
        // Continue without attempts data - non-critical
      }
    }

    // 7. Calculate attempt count and success rate for each question
    currentStep = 'calculating statistics';
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

    // 8. Instead of using selectAdaptiveQuestions which might be causing the error,
    // Implement a simplified selection algorithm directly in this route handler
    currentStep = 'selecting questions';
    console.log('Adaptive Question Selection - Session Details:', {
      userId,
      subtopicId,
      testAttemptId,
      isAdaptiveLearningEnabled,
      availableQuestionsCount: questionStats.length,
      timestamp: new Date().toISOString()
    });

    // Implement a basic adaptive selection algorithm here
    let selectedQuestions;
    
    if (isAdaptiveLearningEnabled && questionStats.length > 0) {
      try {
        // Basic adaptive selection algorithm:
        // 1. Prioritize questions with lower success rates
        // 2. Include a mix of different statuses (To Start, Learning, Mastered)
        // 3. Add some randomization
        
        // Sort questions by success rate (ascending) and add some randomness
        const sortedQuestions = [...questionStats].sort((a, b) => {
          // Primary sort by status: To Start > Learning > Mastered
          const statusOrder: Record<string, number> = { 'To Start': 0, 'Learning': 1, 'Mastered': 2 };
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          
          if (statusDiff !== 0) return statusDiff;
          
          // Secondary sort by success rate
          const rateDiff = a.successRate - b.successRate;
          
          // Add some randomness
          if (Math.abs(rateDiff) < 10) return Math.random() - 0.5;
          
          return rateDiff;
        });
        
        // Take top 10 questions
        selectedQuestions = sortedQuestions.slice(0, Math.min(10, sortedQuestions.length));
        
        // Add selection reason and adaptively selected flag
        selectedQuestions = selectedQuestions.map(q => ({
          ...q,
          selectionReason: 'basic_adaptive_algorithm',
          adaptivelySelected: true
        }));
        
        console.log('Basic adaptive selection completed successfully', {
          selectedCount: selectedQuestions.length
        });
        
        // Log selection to database if needed
        if (testAttemptId && selectedQuestions.length > 0) {
          try {
            console.log('Logging selection to database');
            
            // Insert first question as a record
            await db.insert(adaptiveQuestionSelection).values({
              testAttemptId,
              questionId: selectedQuestions[0].id,
              selectionReason: 'basic_adaptive_algorithm',
              difficultyLevel: selectedQuestions[0].difficultyLevelId,
              sequencePosition: 0
            });
            
            console.log('Selection logged successfully');
          } catch (logError) {
            console.error('Error logging selection:', logError);
            // Non-critical, continue
          }
        }
      } catch (selectError) {
        console.error('Error in adaptive selection:', selectError);
        // Fall back to random selection
        selectedQuestions = [...questionStats]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(10, questionStats.length));
      }
    } else {
      // Random selection as fallback
      selectedQuestions = [...questionStats]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(10, questionStats.length));
    }
    
    currentStep = 'preparing response';
    console.log('Preparing response with', selectedQuestions.length, 'questions');
    
    // Return the response
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
    console.error(`Error in adaptive questions API (step: ${currentStep}):`, error);
    // Log additional error details
    if (error instanceof Error) {
      console.error({
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { success: false, error: `Error in ${currentStep}: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}