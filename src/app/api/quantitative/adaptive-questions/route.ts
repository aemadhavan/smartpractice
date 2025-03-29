// src/app/api/quantitative/adaptive-questions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  quantQuestionAttempts as QuantQuestionAttempts, 
  quantTestAttempts as QuantTestAttempts,
  quantQuestions as QuantQuestions
} from '@/db/quantitative-schema';
import { eq, and, inArray, sql, count, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { currentUser } from '@clerk/nextjs/server';
import { quantAdaptiveQuestionSelection } from '@/db/quantitative-adaptive-schema';

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
    console.log('Quantitative Adaptive Questions API - Request received');
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
    console.log('Quantitative Adaptive Questions API - Request Details:', {
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
      quantAdaptiveQuestionSelectionDefined: !!quantAdaptiveQuestionSelection,
      tableDetails: quantAdaptiveQuestionSelection ? JSON.stringify(Object.keys(quantAdaptiveQuestionSelection)) : 'undefined'
    });

    // 1. Get settings to check if adaptive learning is enabled
    currentStep = 'retrieving user settings';
    let settings;
    try {
      settings = await db.query.userQuantAdaptiveSettings.findFirst({
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
      subtopic = await db.query.quantSubtopics.findFirst({
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

    // 3. Get all questions for this subtopic with user attempt statistics in a single optimized query
    currentStep = 'retrieving questions with statistics';
    
    // Define constants for status determination
    const MASTERY_THRESHOLD = 75; // 75% success rate to be considered "Mastered"
    const STATUS_TO_START = 'To Start';
    const STATUS_LEARNING = 'Learning';
    const STATUS_MASTERED = 'Mastered';
    
    // Initialize questionStats variable outside the try block so it's accessible later
    let questionStats: any[] = [];
    
    try {
      // Alias tables for the subquery
      const qqa = alias(QuantQuestionAttempts, 'qqa');
      const qta = alias(QuantTestAttempts, 'qta');
      
      // Subquery to get attempt statistics per question for this user and subtopic
      const userAttemptsSubquery = db
        .select({
          questionId: qqa.questionId,
          // Count total attempts
          attemptCount: count().as('attempt_count'),
          // Sum correct attempts (1 for correct, 0 for incorrect)
          correctCount: sum(
            sql`CASE WHEN ${qqa.isCorrect} = true THEN 1 ELSE 0 END`
          ).as('correct_count')
        })
        .from(qqa)
        .innerJoin(qta, eq(qqa.testAttemptId, qta.id))
        .where(and(
          eq(qta.userId, userId),
          eq(qta.subtopicId, subtopicId)
        ))
        .groupBy(qqa.questionId)
        .as('user_attempts');
      
      // Main query: Get all active questions for the subtopic with their attempt statistics
      const questionsWithStats = await db
        .select({
          // Question fields
          id: QuantQuestions.id,
          subtopicId: QuantQuestions.subtopicId,
          question: QuantQuestions.question,
          options: QuantQuestions.options,
          correctAnswer: QuantQuestions.correctAnswer,
          explanation: QuantQuestions.explanation,
          formula: QuantQuestions.formula,
          difficultyLevelId: QuantQuestions.difficultyLevelId,
          questionTypeId: QuantQuestions.questionTypeId,
          timeAllocation: QuantQuestions.timeAllocation,
          // Statistics from subquery (with default values for questions without attempts)
          attemptCount: sql<number>`COALESCE(${userAttemptsSubquery.attemptCount}, 0)`.mapWith(Number),
          correctCount: sql<number>`COALESCE(${userAttemptsSubquery.correctCount}, 0)`.mapWith(Number),
          // Calculate success rate directly in SQL
          successRate: sql<number>`
            CASE 
              WHEN COALESCE(${userAttemptsSubquery.attemptCount}, 0) = 0 THEN 0
              ELSE COALESCE(${userAttemptsSubquery.correctCount}, 0) * 100.0 / COALESCE(${userAttemptsSubquery.attemptCount}, 0)
            END
          `.mapWith(Number)
        })
        .from(QuantQuestions)
        .leftJoin(
          userAttemptsSubquery,
          eq(QuantQuestions.id, userAttemptsSubquery.questionId)
        )
        .where(and(
          eq(QuantQuestions.subtopicId, subtopicId),
          eq(QuantQuestions.isActive, true)
        ));
      
      console.log(`Retrieved ${questionsWithStats.length} questions with statistics for subtopic`);
      
      if (questionsWithStats.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No questions available for this subtopic' },
          { status: 404 }
        );
      }
      
      // Process questions to match QuizQuestion format and determine status
      currentStep = 'processing questions';
      questionStats = questionsWithStats.map(question => {
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
        
        // Determine question status based on attempt count and success rate
        let status: 'Mastered' | 'Learning' | 'To Start' = STATUS_TO_START;
        if (question.attemptCount > 0) {
          status = question.successRate >= MASTERY_THRESHOLD ? STATUS_MASTERED : STATUS_LEARNING;
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
          attemptCount: question.attemptCount,
          successRate: question.successRate,
          status: status
        };
      });
    } catch (error) {
      console.error('Error retrieving questions with statistics:', error);
      return NextResponse.json(
        { success: false, error: 'Error retrieving questions with statistics' },
        { status: 500 }
      );
    }

    // 4. Implement a simplified selection algorithm directly in this route handler
    currentStep = 'selecting questions';
    console.log('Quantitative Adaptive Question Selection - Session Details:', {
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
            await db.insert(quantAdaptiveQuestionSelection).values({
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
    console.error(`Error in quantitative adaptive questions API (step: ${currentStep}):`, error);
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