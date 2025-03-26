// File: src/app/quantitative/topics/[topicId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import EnhancedQuizModal from '@/components/EnhancedQuizModal';
import { Option } from '@/lib/options';
import sessionManager from '@/lib/session-manager';
import { processMathExpression } from '@/lib/mathjax-config';

// Define types (keeping existing ones and adding necessary ones for EnhancedQuizModal)
type Question = {
  id: number;
  subtopicId: number;
  question: string;
  options: { id: string; text: string }[] | string | RawOption[]; // Support multiple formats
  correctAnswer: string;
  explanation: string;
  attemptCount: number;
  successRate: number;
  status: 'Mastered' | 'Learning' | 'To Start';
  difficultyLevelId?: number; // Optional fields for EnhancedQuizModal compatibility
  questionTypeId?: number;
  timeAllocation?: number;
  formula?: string;
};

type Subtopic<Q = Question> = {
  id: number;
  name: string;
  description: string;
  questions: Q[];
  stats: {
    total: number;
    mastered: number;
    learning: number;
    toStart: number;
  };
};

type TopicData = {
  topic: {
    id: number;
    name: string;
    description: string;
  };
  subtopics: Subtopic[];
  stats: {
    totalQuestions: number;
    attemptedCount: number;
    masteredCount: number;
    masteryLevel: number;
  };
};

// Define QuizQuestion type to match EnhancedQuizModal
type QuizQuestion = {
  id: number;
  question: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
  formula?: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  attemptCount: number;
  successRate: number;
  status: 'Mastered' | 'Learning' | 'To Start';
  subtopicId: number;
};

// RawOption for processing options
interface RawOption {
  id?: string;
  text?: string;
  [key: string]: unknown;
}

// ProcessedQuestion type for consistency
type ProcessedQuestion = Omit<Question, 'options'> & {
  options: Option[];
};

type OptionInput = { id?: string; text?: string; [key: string]: unknown } | string | number;

// API endpoints for quantitative
const QUANTITATIVE_ENDPOINTS = {
  initSession: '/api/quantitative/init-session',
  trackAttempt: '/api/quantitative/track-attempt',
  completeSession: '/api/quantitative/complete-session'
};

// Function to render math formulas
const renderFormula = (formula: string): React.ReactNode => {
  try {
    // Use the processMathExpression function from mathjax-config
    const processedFormula = processMathExpression(formula);
    return <div className="math-formula" dangerouslySetInnerHTML={{ __html: processedFormula }} />;
  } catch (error) {
    console.error('Error rendering formula with MathJax:', error);
    return <pre className="font-mono text-sm">{formula}</pre>;
  }
};

// Function to calculate new mastery status
const calculateNewStatus = (
  question: QuizQuestion,
  isCorrect: boolean,
  successRate: number
): 'Mastered' | 'Learning' | 'To Start' => {
  if (isCorrect) {
    if (question.status === 'To Start') return 'Learning';
    if (question.status === 'Learning' && successRate >= 75) return 'Mastered';
    return question.status;
  } else {
    if (question.status === 'Mastered') return 'Learning';
    if (question.status === 'Learning' && successRate < 40) return 'To Start';
    return question.status;
  }
};

// Helper to ensure question compatibility
const ensureQuestionCompatibility = (question: Question): QuizQuestion => {
  // Ensure options are in the correct format
  let options: Option[] = [];
  
  try {
    if (Array.isArray(question.options)) {
      options = question.options.map((opt: OptionInput) => {
        if (typeof opt === 'object' && opt !== null && 'id' in opt && 'text' in opt) {
          return {
            id: String(opt.id),
            text: String(opt.text)
          };
        }
        return {
          id: `o${Math.random().toString(36).substring(2, 9)}`,
          text: typeof opt === 'string' ? opt : String(opt)
        };
      });
    } else {
      // Create default options if none exist
      options = [
        { id: 'o1', text: 'Option 1' },
        { id: 'o2', text: 'Option 2' },
        { id: 'o3', text: 'Option 3' },
        { id: 'o4', text: 'Option 4' }
      ];
    }
  } catch (error) {
    console.error('Error processing options:', error);
    options = [
      { id: 'o1', text: 'Option 1' },
      { id: 'o2', text: 'Option 2' },
      { id: 'o3', text: 'Option 3' },
      { id: 'o4', text: 'Option 4' }
    ];
  }
  
  // Return a standardized question object
  return {
    id: question.id || 0,
    question: question.question || 'Question not available',
    options: options,
    correctAnswer: question.correctAnswer || options[0]?.text || 'Option 1',
    explanation: question.explanation || 'No explanation available',
    formula: question.formula || '',
    difficultyLevelId: question.difficultyLevelId || 1,
    questionTypeId: question.questionTypeId || 1,
    timeAllocation: question.timeAllocation || 60,
    attemptCount: question.attemptCount || 0,
    successRate: question.successRate || 0,
    status: question.status || 'To Start',
    subtopicId: question.subtopicId || 0
  };
};

export default function QuantitativeTopicPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedSubtopicForQuiz, setSelectedSubtopicForQuiz] = useState<Subtopic<ProcessedQuestion> | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const needsCompletionRef = useRef(false);
  const CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
  const [processingSubtopic, setProcessingSubtopic] = useState(false);

  const topicId = params.topicId as string;
  const subjectType = 'quantitative';

  const fetchTopicData = useCallback(
    async (force = false) => {
      if (!user?.id) return;

      if (!force && topicData && lastFetched && Date.now() - lastFetched < CACHE_TIME) {
        return;
      }

      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/quantitative/${topicId}?userId=${user.id}&_=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Ensure there's data to set
        if (!data || !data.topic || !data.subtopics) {
          console.error('Invalid data format received:', data);
          throw new Error('Invalid data format received from server');
        }
        
        setTopicData(data);
        setLastFetched(Date.now());
      } catch (err) {
        setError(`${err instanceof Error ? err.message : 'Error loading topic data'}. Please try again later.`);
        console.error('Error fetching topic data:', err);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, topicData, lastFetched, topicId, CACHE_TIME]
  );

  const completeTestSession = useCallback(
    async (sessionId: number) => {
      if (!sessionId || !user?.id) return;

      try {
        console.log('Completing test session:', sessionId);
        const response = await fetch(QUANTITATIVE_ENDPOINTS.completeSession, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testSessionId: sessionId, userId: user.id }),
        });

        if (response.ok) {
          console.log('Successfully completed test session');
          return true;
        } else {
          console.error('Failed to complete test session');
          return false;
        }
      } catch (error) {
        console.error('Error completing test session:', error);
        return false;
      }
    },
    [user?.id]
  );

  useEffect(() => {
    return () => {
      if (needsCompletionRef.current && activeSessionId) {
        completeTestSession(activeSessionId).then(() => {
          console.log(`Test session ${activeSessionId} completed on unmount`);
        });
      }
    };
  }, [activeSessionId, completeTestSession]);

  useEffect(() => {
    if (isLoaded) {
      fetchTopicData();
    }
  }, [isLoaded, fetchTopicData]);

  const handleStartQuiz = async (subtopic: Subtopic): Promise<void> => {
    try {
      // Set processing state to provide feedback
      setProcessingSubtopic(true);
      
      // Enhanced logging
      console.log(`handleStartQuiz received subtopic with ID: ${subtopic.id}, Name: ${subtopic.name}`);
      console.log(`Questions count for subtopic ${subtopic.id}: ${subtopic.questions?.length || 0}`);
      
      if (!subtopic.questions || !Array.isArray(subtopic.questions) || subtopic.questions.length === 0) {
        console.error('No questions found in subtopic', subtopic);
        alert('No questions available for this subtopic. Please try another or contact support.');
        setProcessingSubtopic(false);
        return;
      }

      // Make sure subtopicId is explicitly set on each question
      const processed: ProcessedQuestion[] = subtopic.questions.map((question: Question, index: number) => {
        // Ensure question has the correct subtopicId
        const questionWithSubtopicId = {
          ...question,
          subtopicId: subtopic.id // Explicitly set the subtopicId
        };
        
        // Log each question for debugging
        console.log(`Processing question ${index + 1}/${subtopic.questions.length} for subtopic ${subtopic.id}:`, questionWithSubtopicId);
        
        let processedOptions: Option[] = [];

        try {
          // Check if options exist
          if (!questionWithSubtopicId.options) {
            console.warn(`Question ${questionWithSubtopicId.id} has no options defined`);
            throw new Error('No options defined');
          }

          console.log(`Processing options for question ${questionWithSubtopicId.id}:`, questionWithSubtopicId.options, typeof questionWithSubtopicId.options);

          // Handle different option formats
          if (Array.isArray(questionWithSubtopicId.options) && questionWithSubtopicId.options.length > 0) {
            // 1. Array of objects with id and text
            if (questionWithSubtopicId.options.every(opt => typeof opt === 'object' && opt !== null && 'id' in opt && 'text' in opt)) {
              processedOptions = questionWithSubtopicId.options.map((opt: RawOption) => ({
                id: String(opt.id || `o${Math.random().toString(36).substring(2, 9)}`),
                text: String(opt.text || ''),
              }));
            } 
            // 2. Array of primitive values
            else {
              processedOptions = questionWithSubtopicId.options.map((opt: unknown, i: number) => ({
                id: `o${i + 1}`,
                text: typeof opt === 'string' ? opt : String(opt),
              }));
            }
          } 
          // 3. JSON string
          else if (typeof questionWithSubtopicId.options === 'string') {
            try {
              // Try to parse JSON string
              let parsedOptions;
              // Check if it looks like JSON
              if (questionWithSubtopicId.options.trim().startsWith('[') || questionWithSubtopicId.options.trim().startsWith('{')) {
                parsedOptions = JSON.parse(questionWithSubtopicId.options);
              } else {
                // Split by commas if not JSON
                parsedOptions = questionWithSubtopicId.options.split(',').map(opt => opt.trim()).filter(Boolean);
              }
              
              if (Array.isArray(parsedOptions)) {
                // Process parsed array
                if (parsedOptions.every(opt => typeof opt === 'object' && opt !== null)) {
                  processedOptions = parsedOptions.map((opt: RawOption, i: number) => ({
                    id: String(opt.id || `o${i + 1}`),
                    text: String(opt.text || opt.toString()),
                  }));
                } else {
                  processedOptions = parsedOptions.map((opt: unknown, i: number) => ({
                    id: `o${i + 1}`,
                    text: String(opt),
                  }));
                }
              }
            } catch (e) {
              console.warn('Error parsing options string, trying comma split:', e);
              // Fallback to comma split
              const optionsStr = questionWithSubtopicId.options.split(',').map(opt => opt.trim()).filter(Boolean);
              processedOptions = optionsStr.map((opt, i) => ({
                id: `o${i + 1}`,
                text: opt,
              }));
            }
          }

          // Ensure we have options
          if (processedOptions.length === 0) {
            throw new Error(`No valid options could be extracted for question ${questionWithSubtopicId.id}`);
          }

          // Create standard options - at least 4 options for multiple choice
          while (processedOptions.length < 4) {
            processedOptions.push({
              id: `o${processedOptions.length + 1}`,
              text: `Option ${processedOptions.length + 1}`
            });
          }

          // Normalize options format to ensure consistency
          processedOptions = processedOptions.map((opt, index) => ({
            id: String(opt.id || `o${index + 1}`).replace(/[^a-zA-Z0-9:]/g, ''),
            text: String(opt.text || ''),
          }));

          // Log processed options
          console.log(`Processed ${processedOptions.length} options:`, processedOptions);

          return {
            ...questionWithSubtopicId,
            options: processedOptions,
            difficultyLevelId: questionWithSubtopicId.difficultyLevelId || 1,
            questionTypeId: questionWithSubtopicId.questionTypeId || 1,
            timeAllocation: questionWithSubtopicId.timeAllocation || 60,
            formula: questionWithSubtopicId.formula || '',
          };
        } catch (e) {
          console.error(`Error processing options for question ${questionWithSubtopicId.id} in subtopic ${subtopic.id}:`, e);
          // Create default fallback options
          return {
            ...questionWithSubtopicId,
            options: [
              { id: 'o1', text: 'Option 1' },
              { id: 'o2', text: 'Option 2' },
              { id: 'o3', text: 'Option 3' },
              { id: 'o4', text: 'Option 4' },
            ],
            difficultyLevelId: questionWithSubtopicId.difficultyLevelId || 1,
            questionTypeId: questionWithSubtopicId.questionTypeId || 1,
            timeAllocation: questionWithSubtopicId.timeAllocation || 60,
            formula: questionWithSubtopicId.formula || '',
            // Keep original correctAnswer if available
            correctAnswer: questionWithSubtopicId.correctAnswer || 'Option 1',
          };
        }
      });

      console.log(`Processed ${processed.length} questions for subtopic ${subtopic.id}:`, processed);
      
      // Check if we have any valid questions
      if (processed.length === 0) {
        console.error('No valid questions after processing');
        alert('Error loading questions. Please try again later.');
        setProcessingSubtopic(false);
        return;
      }

      // Ensure all questions are compatible with the QuizQuestion type
      const compatibleQuestions = processed.map(q => ensureQuestionCompatibility({
        ...q,
        subtopicId: subtopic.id // Ensure subtopicId is preserved during compatibility check
      }));

      console.log(`Creating selectedSubtopicForQuiz with ID: ${subtopic.id}, Name: ${subtopic.name}`);
      
      // Set the selected subtopic with processed questions - use a completely new object
      const subtopicForQuiz = {
        id: subtopic.id,
        name: subtopic.name,
        description: subtopic.description,
        stats: { ...subtopic.stats },
        questions: compatibleQuestions as unknown as ProcessedQuestion[],
      };
      
      // Set the selected subtopic
      setSelectedSubtopicForQuiz(subtopicForQuiz);
      console.log(`Set selectedSubtopicForQuiz to:`, subtopicForQuiz);

      // Clear flags
      needsCompletionRef.current = false;
      
      // Use a shorter delay
      setTimeout(() => {
        console.log(`Opening modal for subtopic ${subtopicForQuiz.id}`);
        setIsQuizModalOpen(true);
        setProcessingSubtopic(false);
      }, 50);
    } catch (error) {
      console.error('Error in handleStartQuiz:', error);
      alert('An error occurred while preparing the quiz. Please try again.');
      setProcessingSubtopic(false);
    }
  };

  // Safer version of handleQuestionsUpdate
  const handleQuestionsUpdate = (updatedQuestions: ProcessedQuestion[]): void => {
    console.log('Updating questions with new data:', updatedQuestions);
    if (selectedSubtopicForQuiz) {
      try {
        // Ensure there are questions to update
        if (!updatedQuestions || !Array.isArray(updatedQuestions)) {
          console.error('Invalid questions data received:', updatedQuestions);
          return;
        }
        
        setSelectedSubtopicForQuiz({
          ...selectedSubtopicForQuiz,
          questions: updatedQuestions,
        });
      } catch (error) {
        console.error('Error updating questions:', error);
      }
    }
  };

  const handleSessionIdUpdate = (sessionId: number | null): void => {
    console.log('[DEBUG SESSION] Received session ID update:', sessionId);
    if (sessionId) {
      setActiveSessionId(sessionId);
      needsCompletionRef.current = true;
      
      // Also update the session manager
      sessionManager.setSessionId(sessionId);
    } else {
      setActiveSessionId(null);
      needsCompletionRef.current = false;
      
      // Reset the session manager
      sessionManager.reset();
    }
  };

  // Safer question update adapter
  const safeQuestionUpdateAdapter = (updatedQuestions: QuizQuestion[]): void => {
    try {
      console.log('Updating questions with adapter:', updatedQuestions);
      
      // Check if the data is valid
      if (!updatedQuestions || !Array.isArray(updatedQuestions)) {
        console.error('Invalid question data in adapter:', updatedQuestions);
        return;
      }
      
      handleQuestionsUpdate(updatedQuestions as unknown as ProcessedQuestion[]);
    } catch (error) {
      console.error('Error in question update adapter:', error);
      // Fallback update method
      if (selectedSubtopicForQuiz) {
        setSelectedSubtopicForQuiz({
          ...selectedSubtopicForQuiz,
          questions: updatedQuestions as unknown as ProcessedQuestion[],
        });
      }
    }
  };

  const handleCloseQuizModal = async (): Promise<void> => {
    if (activeSessionId && needsCompletionRef.current && user) {
      try {
        const success = await sessionManager.completeSession(user.id, activeSessionId, QUANTITATIVE_ENDPOINTS.completeSession);
        if (success) {
          console.log('[DEBUG SESSION] Successfully completed session ID:', activeSessionId);
        } else {
          console.warn('[DEBUG SESSION] Failed to complete session');
        }
      } catch (error) {
        console.error('[DEBUG SESSION] Error completing test session on close:', error);
      }
      needsCompletionRef.current = false;
    }
  
    // Reset both the local state and the session manager
    setActiveSessionId(null);
    sessionManager.reset();
    setIsQuizModalOpen(false);
  
    setTimeout(() => {
      fetchTopicData(true).then(() => {
        setSelectedSubtopicForQuiz(null);
      });
    }, 500);
  };

  // Safety handler for the Practice Now button
  const handlePracticeNowClick = (e: React.MouseEvent, subtopic: Subtopic) => {
    e.stopPropagation(); // Prevent parent div's onClick from triggering
    
    // Add enhanced logging to track the exact subtopic being clicked
    console.log(`PracticeNow clicked for subtopic ID: ${subtopic.id}, Name: ${subtopic.name}`);
    
    // Check if the subtopic has questions
    if (!subtopic.questions || subtopic.questions.length === 0) {
      console.error('No questions available for this subtopic:', subtopic.name);
      alert('No questions available for this subtopic. Please try another.');
      return;
    }
    
    console.log(`Starting quiz for ${subtopic.name} with ${subtopic.questions.length} questions`);
    
    // Explicitly create a copy of the subtopic to ensure we're not losing reference
    const subtopicToProcess = { ...subtopic };
    console.log('Sending subtopic to handleStartQuiz:', subtopicToProcess);
    
    // Call handleStartQuiz with the explicit copy
    handleStartQuiz(subtopicToProcess);
  };

  if (!isLoaded || loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-4 h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 p-4 rounded-lg">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 shadow-sm">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full mb-3"></div>
              <div className="flex justify-between mb-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-full bg-blue-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please sign in to access quantitative practice.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
        <button onClick={() => fetchTopicData(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Try Again
        </button>
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No data available for this topic.</p>
        <button onClick={() => router.push('/quantitative')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Back to Topics
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white max-w-6xl mx-auto">
      {/* Processing indicator */}
      {processingSubtopic && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium">Loading questions...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <Link href="/quantitative">
          <button className="flex items-center text-blue-600 hover:text-blue-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Topics
          </button>
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{topicData.topic.name}</h1>
          <p className="text-gray-600 mt-2">{topicData.topic.description}</p>
        </div>
        <button
          onClick={() => fetchTopicData(true)}
          className="p-2 text-blue-600 hover:text-blue-800"
          title="Refresh data"
          aria-label="Refresh data"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-700">Total Questions</div>
          <div className="text-2xl font-bold text-blue-800">{topicData.stats.totalQuestions}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-700">Mastered</div>
          <div className="text-2xl font-bold text-green-800">{topicData.stats.masteredCount}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-orange-700">Learning</div>
          <div className="text-2xl font-bold text-orange-800">{topicData.stats.attemptedCount - topicData.stats.masteredCount}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-700">To Start</div>
          <div className="text-2xl font-bold text-purple-800">{topicData.stats.totalQuestions - topicData.stats.attemptedCount}</div>
        </div>
      </div>
      <div className="mb-8">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-700">Overall Mastery</span>
          <span className="text-sm text-gray-700">{topicData.stats.masteryLevel}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${topicData.stats.masteryLevel}%` }}></div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Subtopics</h2>

      {topicData.subtopics.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-yellow-800">
          No subtopics available for this topic yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {topicData.subtopics.map((subtopic) => (
            <div
              key={subtopic.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={(e: React.MouseEvent) => handlePracticeNowClick(e, subtopic)}
            >
              <div className="font-medium text-lg mb-2">{subtopic.name}</div>
              <div className="text-sm text-gray-600 mb-3">{subtopic.stats.total} questions</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${(subtopic.stats.mastered / Math.max(subtopic.stats.total, 1)) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mb-4">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  <span>{subtopic.stats.mastered} mastered</span>
                </span>
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
                  <span>{subtopic.stats.learning} learning</span>
                </span>
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-gray-400 mr-1"></span>
                  <span>{subtopic.stats.toStart} to start</span>
                </span>
              </div>
              <button
                className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                onClick={(e: React.MouseEvent) => handlePracticeNowClick(e, subtopic)}
              >
                Practice Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && selectedSubtopicForQuiz && (
        <div className="fixed bottom-0 right-0 p-2 bg-gray-800 text-white text-xs z-50">
          Modal: {isQuizModalOpen ? 'Open' : 'Closed'} | 
          Questions: {selectedSubtopicForQuiz.questions?.length || 0} | 
          Subtopic: {selectedSubtopicForQuiz.name || 'None'} |
          Subtopic ID: {selectedSubtopicForQuiz.id || 'None'}
        </div>
      )}

      {/* Quiz Modal */}
      {selectedSubtopicForQuiz && (()=>{
        
        console.log('Rendering EnhancedQuizModal with:', {
            isOpen: isQuizModalOpen,
            subtopicName: selectedSubtopicForQuiz.name,
            subtopicId: selectedSubtopicForQuiz.id,
            questionCount: selectedSubtopicForQuiz.questions.length
          });
          return(
            <EnhancedQuizModal
            isOpen={isQuizModalOpen}
            onClose={handleCloseQuizModal}
            subtopicName={selectedSubtopicForQuiz.name}
            questions={selectedSubtopicForQuiz.questions as QuizQuestion[]}
            userId={user.id}
            topicId={Number(topicId)}
            onQuestionsUpdate={safeQuestionUpdateAdapter}
            onSessionIdUpdate={handleSessionIdUpdate}
            testSessionId={activeSessionId}
            apiEndpoints={QUANTITATIVE_ENDPOINTS}
            renderFormula={renderFormula}
            calculateNewStatus={calculateNewStatus}
            subjectType={subjectType}
          />
          );
          
        
      })()}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Debug Information</h3>
          <div className="text-xs text-gray-700">
            <p>Total subtopics: {topicData.subtopics.length}</p>
            <p>Total questions: {topicData.stats.totalQuestions}</p>
            <p>Data last fetched: {lastFetched ? new Date(lastFetched).toLocaleTimeString() : 'Never'}</p>
            <p>Topic ID: {topicId}</p>
            <p>Current session ID: {activeSessionId || 'None'}</p>
            <p>Session needs completion: {needsCompletionRef.current ? 'Yes' : 'No'}</p>
            <p>Selected subtopic: {selectedSubtopicForQuiz?.name || 'None'}</p>
            <p>Selected subtopic ID: {selectedSubtopicForQuiz?.id || 'None'}</p>
            <p>Questions in selected subtopic: {selectedSubtopicForQuiz?.questions?.length || 0}</p>
            <p>Quiz modal open: {isQuizModalOpen ? 'Yes' : 'No'}</p>
            <p>Processing subtopic: {processingSubtopic ? 'Yes' : 'No'}</p>
          </div>
          
          {/* Force Open Modal button for testing */}
          {selectedSubtopicForQuiz && !isQuizModalOpen && (
            <button 
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded shadow text-xs"
              onClick={() => setIsQuizModalOpen(true)}
            >
              Force Open Modal
            </button>
          )}
          
          {/* Force Clear Selection button for testing */}
          {selectedSubtopicForQuiz && (
            <button 
              className="mt-2 ml-2 bg-gray-600 text-white px-4 py-2 rounded shadow text-xs"
              onClick={() => setSelectedSubtopicForQuiz(null)}
            >
              Clear Selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
      