//File: /src/app/maths/topics/[topicId]/questions/page.tsx

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import QuizPage from '@/components/quiz/QuizPage';
import QuizSummary from '@/components/quiz/QuizSummary';
import { AttemptData, QuizSummaryProps } from '@/types/quiz';
import { processMathExpression } from '@/lib/mathjax-config';
import { Option } from '@/lib/options';

// API endpoints for maths
const MATH_ENDPOINTS = {
  initSession: '/api/maths/init-session',
  trackAttempt: '/api/maths/track-attempt',
  completeSession: '/api/maths/complete-session',
  adaptiveFeedback: '/api/maths/adaptive-feedback',
  adaptiveSettings: '/api/maths/adaptive-settings',
};

// QuizQuestion type
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

// Subtopic type
type Subtopic = {
  id: number;
  name: string;
  description: string;
  questions: QuizQuestion[]; // Use the QuizQuestion type directly
  stats: {
    total: number;
    mastered: number;
    learning: number;
    toStart: number;
  };
};

// Function to render math formulas
const renderFormula = (formula: string): React.ReactNode => {
  try {
    // Use the processMathExpression function
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

export default function QuestionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [processedQuestions, setProcessedQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const topicId = params.topicId as string;
  const subjectType = 'maths';

  // Function to process question options
  const processOptions = (question: Record<string, unknown>): QuizQuestion => {
    let processedOptions: Option[] = [];
    try {
      console.log(`Processing options for question ${question.id}:`, question.options, typeof question.options);
      if (Array.isArray(question.options) && question.options.length > 0) {
        if (question.options.every((opt: Record<string, unknown>) => typeof opt === 'object' && 'id' in opt && 'text' in opt)) {
          processedOptions = question.options.map((opt: Record<string, unknown>) => ({
            id: String(opt.id),
            text: String(opt.text),
          }));
        } else {
          processedOptions = question.options.map((opt: unknown) => ({
            id: `o${String(opt)}`,
            text: typeof opt === 'string' ? opt : String(opt),
          }));
        }
      } else if (typeof question.options === 'string') {
        try {
          const parsedOptions = JSON.parse(question.options as string);
          if (Array.isArray(parsedOptions)) {
            processedOptions = parsedOptions.map((opt: Record<string, unknown>) => ({
              id: String(opt.id || `o:${opt.text || String(opt)}`),
              text: String(opt.text || String(opt)),
            }));
          }
        } catch (e) {
          console.error('Error parsing options string:', e);
          const optionsStr = (question.options as string).split(',').map((opt: string) => opt.trim()).filter(Boolean);
          processedOptions = optionsStr.map((opt: string) => ({
            id: `o:${opt}`,
            text: opt,
          }));
        }
      }
      if (processedOptions.length === 0 || processedOptions.length < 4) {
        throw new Error(`No valid options found for question ${question.id}`);
      }
      processedOptions = processedOptions.map((opt: Option, index: number) => ({
        id: `o${index + 1}:${opt.text}`,
        text: opt.text,
      }));
      return {
        ...question,
        options: processedOptions,
        difficultyLevelId: Number(question.difficultyLevelId) || 1,
        questionTypeId: Number(question.questionTypeId) || 1,
        timeAllocation: Number(question.timeAllocation) || 60,
        formula: question.formula as string || '',
      } as QuizQuestion;
    } catch (e) {
      console.error('Error processing options for question', question.id, e);
      return {
        ...question,
        options: [
          { id: 'o1:Error', text: 'Error loading options' },
          { id: 'o2:Try again', text: 'Try again' },
          { id: 'o3:Contact support', text: 'Contact support' },
          { id: 'o4:Skip this question', text: 'Skip this question' },
        ],
        difficultyLevelId: Number(question.difficultyLevelId) || 1,
        questionTypeId: Number(question.questionTypeId) || 1,
        timeAllocation: Number(question.timeAllocation) || 60,
        formula: question.formula as string || '',
        correctAnswer: question.correctAnswer as string || 'Error loading options',
      } as QuizQuestion;
    }
  };

  // Fetch subtopic data
  const fetchSubtopicData = useCallback(async () => {
    if (!user?.id || !topicId) return;
    try {
      setLoading(true);
      // First get all subtopics for this topic
      const response = await fetch(`/api/maths/${topicId}?userId=${user.id}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data: { subtopics: Subtopic[] } = await response.json();
      // Get subtopicId from query parameter
      const subtopicId = searchParams.get('subtopicId');
      console.log('Fetching questions for subtopicId:', subtopicId);
      if (data.subtopics && data.subtopics.length > 0) {
        // Find the subtopic by ID if provided, otherwise use the first one
        let selectedSubtopic;
        if (subtopicId) {
          // Try to find the subtopic with the matching ID
          selectedSubtopic = data.subtopics.find(
            (s: Subtopic) => s.id === Number(subtopicId)
          );
        }
        // Fall back to first subtopic if not found
        if (!selectedSubtopic) {
          console.log('Subtopic not found by ID, using first subtopic');
          selectedSubtopic = data.subtopics[0];
        }
        console.log('Selected subtopic:', selectedSubtopic.name, 'ID:', selectedSubtopic.id);
        setSubtopic(selectedSubtopic);
        // Process the questions
        const processed = selectedSubtopic.questions.map((question) => {
          console.log('Processing question:', question);
          return processOptions(question);
        });
          
        setProcessedQuestions(processed);
      } else {
        throw new Error('No subtopics found for this topic');
      }
    } catch (err) {
      setError(`${err instanceof Error ? err.message : 'Error loading subtopic data'}. Please try again later.`);
      console.error('Error fetching subtopic data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, topicId, searchParams]);

  // Complete session when leaving the page
  const completeTestSession = useCallback(
    async (sessionId: number) => {
      if (!sessionId || !user?.id) return;
      try {
        console.log('Completing test session:', sessionId);
        const response = await fetch(MATH_ENDPOINTS.completeSession, {
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

  // Fetch data when user is loaded
  useEffect(() => {
    if (isLoaded) {
      fetchSubtopicData();
    }
  }, [isLoaded, fetchSubtopicData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeSessionId) {
        completeTestSession(activeSessionId).then(() => {
          console.log(`Test session ${activeSessionId} completed on unmount`);
        });
      }
    };
  }, [activeSessionId, completeTestSession]);

  // Handle session ID update
  const handleSessionIdUpdate = (sessionId: number | null) => {
    setActiveSessionId(sessionId);
  };

  // Handle questions update
  const handleQuestionsUpdate = (updatedQuestions: QuizQuestion[]) => {
    setProcessedQuestions(updatedQuestions);
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
        <p>Loading questions...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          <h2 className="font-semibold mb-2">Error Loading Questions</h2>
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => fetchSubtopicData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No user logged in
  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-gray-600">Please sign in to access math practice.</p>
      </div>
    );
  }

  // No subtopic found
  if (!subtopic || processedQuestions.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
          <h2 className="font-semibold mb-2">No Questions Available</h2>
          <p>No questions are available for this topic.</p>
        </div>
        <div className="mt-4">
          <a 
            href={`/maths/topics/${topicId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md inline-block"
          >
            Back to Topic
          </a>
        </div>
      </div>
    );
  }

  // Render the quiz
return (
  <div className="p-4">
    <QuizPage
        subtopicName={subtopic.name}
        questions={processedQuestions}
        userId={user.id}
        topicId={Number(topicId)}
        onQuestionsUpdate={handleQuestionsUpdate}
        onSessionIdUpdate={handleSessionIdUpdate}
        apiEndpoints={MATH_ENDPOINTS}
        renderFormula={renderFormula}
        calculateNewStatus={calculateNewStatus}
        subjectType={subjectType}
        QuizSummaryComponent={QuizSummary as React.ComponentType<QuizSummaryProps>}
        sessionManager={{
          initSession: async (userId, subtopicId, endpoint) => {
            try {
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, subtopicId })
              });
              if (response.ok) {
                const data = await response.json();
                console.log("Session initialization response:", data);
                // Accept either testAttemptId or sessionId
                const sessionId = data.testAttemptId || data.sessionId;
                if (!sessionId) {
                  console.error("No valid session ID found in response:", data);
                  return null;
                }
                
                return sessionId;
              }
              return null;
            } catch (error) {
              console.error('Error initializing session:', error);
              return null;
            }
          },
          trackAttempt:  async (attemptData: AttemptData, endpoint: string): Promise<boolean> => {
            try {
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attemptData),
              });
              
              // Return true if the request was successful
              return response.ok;
            } catch (error) {
              console.error('Error tracking attempt:', error);
              return false;
            }
          },
          completeSession: async (userId,sessionId, endpoint) => {
            try {
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({  testSessionId: sessionId,userId })
              });
              return response.ok;
            } catch (error) {
              console.error('Error completing session:', error);
              return false;
            }
          }
        }}
        renderers={{
          questionRenderer: (content: string) => (
            <div className="text-lg">
              {processMathExpression(content)}
            </div>
          ),
          optionTextRenderer: (text: string | Option | null | undefined) => {
            // Similar to previous implementation
            let textValue: string;
            
            if (typeof text === 'string') {
              textValue = text;
            } else if (typeof text === 'object' && text && 'text' in text) {
              textValue = String((text as Option).text);
            } else {
              textValue = text ? String(text) : '';
            }
            
            return <div dangerouslySetInnerHTML={{ __html: processMathExpression(textValue) }} />;
          },
          mathJaxRenderer: (content: string) => {
            return <div dangerouslySetInnerHTML={{ __html: processMathExpression(content) }} />;
          }
        }}
      />
  </div>
  );
}