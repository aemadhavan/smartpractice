// File: src/app/quantitative/topics/[topicId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import EnhancedQuizModal from '@/components/EnhancedQuizModal';
import { Option } from '@/lib/options';

// Define the QuizQuestion type (matching the type in QuizModal)
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

// Define a type for raw option objects to replace 'any'
interface RawOption {
  id?: string;
  text?: string;
  [key: string]: unknown; // For other potential properties
}

// Type definitions
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

type Question = {
  id: number;
  question: string;
  options: Option[] | string | RawOption[]; // More specific type to replace any
  correctAnswer: string; // The text value of the correct answer
  explanation: string;
  formula?: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  attemptCount: number;
  successRate: number;
  status: 'Mastered' | 'Learning' | 'To Start';
  subtopicId?: number;
};

type ProcessedQuestion = Omit<Question, 'options' | 'subtopicId'> & {
  subtopicId: number; // Make subtopicId required in the processed version
  options: Option[]; // Ensure options are in the proper format after processing
};

type TopicDetail = {
  id: number;
  name: string;
  description: string;
};

type TopicData = {
  topic: TopicDetail;
  subtopics: Subtopic[];
  stats: {
    totalQuestions: number;
    attemptedCount: number;
    masteredCount: number;
    masteryLevel: number;
  };
};

const QUANTITATIVE_ENDPOINTS = {
  initSession: '/api/quantitative/init-session',
  trackAttempt: '/api/quantitative/track-attempt',
  completeSession: '/api/quantitative/complete-session'
};
const MATH_ENDPOINTS = {
  initSession: '/api/maths/init-session',
  trackAttempt: '/api/maths/track-attempt',
  completeSession: '/api/maths/complete-session'
};

// Function to render math formulas
const renderFormula = (formula: string): React.ReactNode => {
  // Check if MathJax is available globally
  if (typeof window !== 'undefined' && 'MathJax' in window) {
    try {
      // Use a div reference to render the formula
      const formulaElement = document.createElement('div');
      formulaElement.innerHTML = formula;
      
      // @ts-ignore - MathJax is loaded globally
      window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, formulaElement]);
      
      return <div dangerouslySetInnerHTML={{ __html: formula }} />;
    } catch (error) {
      console.error('Error rendering formula with MathJax:', error);
      return <pre className="font-mono text-sm">{formula}</pre>;
    }
  }
  
  // Fallback if MathJax is not available
  return <pre className="font-mono text-sm">{formula}</pre>;
};

// Function to calculate new mastery status
const calculateNewStatus = (
  question: QuizQuestion, 
  isCorrect: boolean, 
  successRate: number
): 'Mastered' | 'Learning' | 'To Start' => {
  // Mastery rules for math questions
  if (isCorrect) {
    if (question.status === 'To Start') {
      return 'Learning';
    } else if (question.status === 'Learning' && successRate >= 75) {
      return 'Mastered';
    } else {
      return question.status;
    }
  } else {
    // If incorrect
    if (question.status === 'Mastered') {
      return 'Learning';
    } else if (question.status === 'Learning' && successRate < 40) {
      return 'To Start';
    } else {
      return question.status;
    }
  }
};

const TopicDetailPage = () => {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const { topicId } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedSubtopicForQuiz, setSelectedSubtopicForQuiz] = useState<Subtopic<ProcessedQuestion> | null>(null);
  
  // Single session ID - only used to track the active session from the modal
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // This would be determined based on your routing or a prop
  const subjectType = 'quantitative'; // or 'maths'
  
  // Select the appropriate API endpoints based on subject
  const apiEndpoints = subjectType === 'quantitative' 
    ? QUANTITATIVE_ENDPOINTS  // Use QUANTITATIVE_ENDPOINTS for 'quantitative'
    : MATH_ENDPOINTS;         // Use MATH_ENDPOINTS for 'maths'

  // Ref to track if test session needs to be completed on unmount
  const needsCompletionRef = useRef(false);

  // Fetch topic data with cache busting
  const fetchTopicData = useCallback(async (): Promise<void> => {
    if (!user?.id || !topicId) return;
    
    try {
      setLoading(true);
      
      // Add cache-busting parameter to prevent browser caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/quantitative/${topicId}?userId=${user.id}&_=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Topic not found');
        }
        throw new Error('Failed to fetch topic data');
      }
      
      const data = await response.json();
      console.log("Fetched topic data:", data);
      
      setTopicData(data);
    } catch (err) {
      console.error('Error fetching topic data:', err);
      setError('Error loading topic data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, topicId]);
  
  // Function to complete test session
  const completeTestSession = useCallback(async (sessionId: number) => {
    if (!sessionId || !user?.id) return;
    
    try {
      console.log('Completing test session:', sessionId);
      
      const response = await fetch(apiEndpoints.completeSession, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testSessionId: sessionId,
          userId: user.id
        })
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
  }, [user?.id, apiEndpoints.completeSession]);

  // Effect to ensure test session completion when the component unmounts
  useEffect(() => {
    return () => {
      if (needsCompletionRef.current && activeSessionId) {
        completeTestSession(activeSessionId).then(() => {
          console.log(`Test session ${activeSessionId} completed on unmount`);
        });
      }
    };
  }, [activeSessionId, completeTestSession]);

  // Load topic data when user is loaded
  useEffect(() => {
    if (isLoaded) {
      fetchTopicData();
    }
  }, [isLoaded, fetchTopicData]);
 
  // Improved handleStartQuiz with better option processing
  const handleStartQuiz = async (subtopic: Subtopic): Promise<void> => {
    // Process questions to ensure options are properly handled
    const processed: ProcessedQuestion[] = subtopic.questions.map((question: Question) => {
      let processedOptions: Option[] = [];
      
      try {
        console.log(`Processing options for question ${question.id}:`, question.options, typeof question.options);

        // Handle the database format directly: [{id:"o1",text:"12"},...]
        if (Array.isArray(question.options) && question.options.length > 0) {
          // Check if options are already in the correct {id, text} format
          if (question.options.every(opt => typeof opt === 'object' && 'id' in opt && 'text' in opt)) {
            processedOptions = question.options.map((opt: RawOption) => ({
              id: String(opt.id), // Ensure id is a string (e.g., "o1")
              text: String(opt.text) // Ensure text is a string (e.g., "12")
            }));
          } else {
            // Fallback: Handle if options are an array of primitives (e.g., ["12", "15",...])
            processedOptions = question.options.map((opt: unknown) => ({
              id: `o${String(opt)}`,
              text: typeof opt === 'string' ? opt : String(opt)
            }));
          }
        } else if (typeof question.options === 'string') {
          // Handle string format (e.g., "[{"id":"o1","text":"12"},...]") by parsing JSON
          try {
            const parsedOptions = JSON.parse(question.options);
            if (Array.isArray(parsedOptions)) {
              processedOptions = parsedOptions.map((opt: RawOption) => ({
                id: String(opt.id || `o:${opt.text || String(opt)}`),
                text: String(opt.text || String(opt))
              }));
            }
          } catch (e) {
            console.error('Error parsing options string:', e);
            // Fallback: Split by commas if not valid JSON
            const optionsStr = question.options.split(',').map(opt => opt.trim()).filter(Boolean);
            processedOptions = optionsStr.map((opt) => ({
              id: `o:${opt}`,
              text: opt
            }));
          }
        }

        // Validate that we have options
        if (processedOptions.length === 0 || processedOptions.length < 4) {
          throw new Error(`No valid options found for question ${question.id}`);
        }

        // Ensure exactly 4 options (if fewer, pad with defaults; if more, truncate)
        if (processedOptions.length !== 4) {
          processedOptions = processedOptions.slice(0, 4).map((opt, index) => ({
            id: `o${index + 1}:${opt.text}`,
            text: opt.text
          }));
        }

        // Create processed question with validated options
        return {
          ...question,
          subtopicId: subtopic.id,
          options: processedOptions,
          correctAnswer: question.correctAnswer // Ensure correctAnswer is the text value (e.g., "15")
        };
      } catch (e) {
        console.error('Error processing options for question', question.id, e);
        
        // Provide fallback options in case of error
        return {
          ...question,
          subtopicId: subtopic.id,
          options: [
            { id: "o1:Error", text: "Error loading options" },
            { id: "o2:Try again", text: "Try again" },
            { id: "o3:Contact support", text: "Contact support" },
            { id: "o4:Skip this question", text: "Skip this question" }
          ],
          correctAnswer: question.correctAnswer || "Error loading options"
        };
      }
    });

    // Set the selectedSubtopicForQuiz with processed questions
    console.log("Processed questions for quiz:", processed);
    setSelectedSubtopicForQuiz({
      ...subtopic,
      questions: processed
    });

    // Reset session management state before opening modal
    needsCompletionRef.current = false;
    
    // Don't reset activeSessionId here to avoid canceling existing sessions
    // Let the modal handle session creation exclusively

    // Open the quiz modal
    setIsQuizModalOpen(true);
  };

  // Handle question updates (e.g., after completing questions)
  const handleQuestionsUpdate = (updatedQuestions: ProcessedQuestion[]): void => {
    console.log('Updating questions with new data:', updatedQuestions);
    
    // Update the selectedSubtopicForQuiz
    if (selectedSubtopicForQuiz) {
      setSelectedSubtopicForQuiz({
        ...selectedSubtopicForQuiz,
        questions: updatedQuestions 
      });
    }
  };

  // Handler to receive test session ID from the QuizModal
  const handleSessionIdUpdate = (sessionId: number | null): void => {
    console.log('[DEBUG SESSION] Received session ID update:', sessionId);
    
    if (sessionId) {
      setActiveSessionId(sessionId);
      needsCompletionRef.current = true;
      console.log('[DEBUG SESSION] Set activeSessionId to:', sessionId);
    } else {
      // Session completed or no longer active
      setActiveSessionId(null);
      needsCompletionRef.current = false;
      console.log('[DEBUG SESSION] Cleared activeSessionId');
    }
  };

  // Adapter to convert QuizQuestion to ProcessedQuestion
  const questionUpdateAdapter = (updatedQuestions: QuizQuestion[]): void => {
    handleQuestionsUpdate(updatedQuestions as unknown as ProcessedQuestion[]);
  };

  // Close quiz modal and complete test session
  const handleCloseQuizModal = async (): Promise<void> => {
    console.log('[DEBUG SESSION] Closing quiz modal - current session ID:', activeSessionId);
    
    // Complete the session if one exists
    if (activeSessionId && needsCompletionRef.current) {
      try {
        console.log('[DEBUG SESSION] Attempting to complete session ID:', activeSessionId);
        
        const success = await completeTestSession(activeSessionId);
        
        if (success) {
          console.log('[DEBUG SESSION] Successfully completed session ID:', activeSessionId);
        } else {
          console.warn('[DEBUG SESSION] Failed to complete session, may already be completed');
        }
      } catch (error) {
        console.error('[DEBUG SESSION] Error completing test session on close:', error);
      }
      
      // Reset state after completion attempt
      needsCompletionRef.current = false;
    }
    
    // Reset session ID reference
    setActiveSessionId(null);
    
    // Close the modal
    setIsQuizModalOpen(false);
    
    // Refresh data after a delay to ensure proper cleanup
    setTimeout(() => {
      console.log('Refreshing topic data after quiz completion');
      fetchTopicData().then(() => {
        console.log('Topic data refreshed');
        setSelectedSubtopicForQuiz(null);
      });
    }, 500);
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2">Loading subtopic data...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please sign in to access quantitative practice.</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push('/quantitative')}
        >
          Back to Topics
        </button>
      </div>
    );
  }

  // Error state
  if (error || !topicData) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error || 'Failed to load topic data'}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push('/quantitative')}
        >
          Back to Topics
        </button>
      </div>
    );
  }

  const { topic, subtopics, stats } = topicData;

  return (
    <div className="p-6 bg-white max-w-6xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/quantitative">
          <button className="flex items-center text-blue-600">
            <span className="mr-1">←</span> Back to Topics
          </button>
        </Link>
      </div>

      {/* Topic header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{topic.name}</h1>
        <p className="text-gray-600">{topic.description}</p>
      </div>

      {/* Topic stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-700">Total Questions</div>
          <div className="text-2xl font-bold text-blue-800">{stats.totalQuestions}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-700">Attempted</div>
          <div className="text-2xl font-bold text-blue-800">{stats.attemptedCount}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-700">Mastered</div>
          <div className="text-2xl font-bold text-green-800">{stats.masteredCount}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-700">Mastery Level</div>
          <div className="text-2xl font-bold text-purple-800">{stats.masteryLevel}%</div>
        </div>
      </div>

      {/* Subtopics section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Subtopics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subtopics.map((subtopic: Subtopic) => (
            <div 
              key={subtopic.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => handleStartQuiz(subtopic)}
            >
              <div className="font-medium text-lg mb-2">{subtopic.name}</div>
              <div className="text-sm text-gray-600 mb-3">
                {subtopic.stats.total} questions
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${(subtopic.stats.mastered / Math.max(subtopic.stats.total, 1)) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs mb-3">
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
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStartQuiz(subtopic);
                }}
              >
                Practice Now
              </button>
            </div>
          ))}
        </div>
      </div>
        
      {/* Using the EnhancedQuizModal */}
      {selectedSubtopicForQuiz && (
          <EnhancedQuizModal
            isOpen={isQuizModalOpen}
            onClose={handleCloseQuizModal}
            subtopicName={selectedSubtopicForQuiz.name}
            questions={selectedSubtopicForQuiz.questions as QuizQuestion[]}
            userId={user.id}
            topicId={Number(topicId)}
            onQuestionsUpdate={questionUpdateAdapter}
            onSessionIdUpdate={handleSessionIdUpdate}
            testSessionId={null} // Do not pass session ID - let the modal handle it
            apiEndpoints={apiEndpoints}
            renderFormula={subjectType === 'quantitative' ? renderFormula : undefined}
            calculateNewStatus={subjectType === 'quantitative' ? calculateNewStatus : undefined}
            subjectType={subjectType}
          />
      )}
        
      {/* Debug information in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Debug Information</h3>
          <div className="text-xs text-gray-700">
            <p>Current session ID: {activeSessionId || 'None'}</p>
            <p>Session needs completion: {needsCompletionRef.current ? 'Yes' : 'No'}</p>
            <p>Total subtopics: {subtopics.length}</p>
            <p>Total questions: {stats.totalQuestions}</p>
            <p>Selected subtopic: {selectedSubtopicForQuiz?.name || 'None'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicDetailPage;