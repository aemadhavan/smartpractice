// File: /src/app/maths/topics/[topicId]/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import EnhancedQuizModal from '@/components/EnhancedQuizModal';
import { Option } from '@/lib/options';

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

// API endpoints for maths
const MATH_ENDPOINTS = {
  initSession: '/api/maths/init-session',
  trackAttempt: '/api/maths/track-attempt',
  completeSession: '/api/maths/complete-session',
};

// Function to render math formulas (copied from quantitative page)
const renderFormula = (formula: string): React.ReactNode => {
  if (typeof window !== 'undefined' && 'MathJax' in window) {
    try {
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
  return <pre className="font-mono text-sm">{formula}</pre>;
};

// Function to calculate new mastery status (copied from quantitative page)
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

export default function MathTopicPage({ params }: { params: { topicId: string } }) {
  const router = useRouter();
  const pathParams = useParams();
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

  const topicId = pathParams.topicId as string || params.topicId;
  const subjectType = 'maths';

  const fetchTopicData = useCallback(
    async (force = false) => {
      if (!user?.id) return;

      if (!force && topicData && lastFetched && Date.now() - lastFetched < CACHE_TIME) {
        return;
      }

      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/maths/${topicId}?userId=${user.id}&_=${timestamp}`, {
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
        setTopicData(data);
        setLastFetched(Date.now());
      } catch (err) {
        setError(`${err instanceof Error ? err.message : 'Error loading topic data'}. Please try again later.`);
        console.error('Error fetching topic data:', err);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, topicData, lastFetched, topicId]
  );

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
    const processed: ProcessedQuestion[] = subtopic.questions.map((question: Question) => {
      let processedOptions: Option[] = [];

      try {
        console.log(`Processing options for question ${question.id}:`, question.options, typeof question.options);

        if (Array.isArray(question.options) && question.options.length > 0) {
          if (question.options.every(opt => typeof opt === 'object' && 'id' in opt && 'text' in opt)) {
            processedOptions = question.options.map((opt: RawOption) => ({
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
            const parsedOptions = JSON.parse(question.options);
            if (Array.isArray(parsedOptions)) {
              processedOptions = parsedOptions.map((opt: RawOption) => ({
                id: String(opt.id || `o:${opt.text || String(opt)}`),
                text: String(opt.text || String(opt)),
              }));
            }
          } catch (e) {
            console.error('Error parsing options string:', e);
            const optionsStr = question.options.split(',').map(opt => opt.trim()).filter(Boolean);
            processedOptions = optionsStr.map(opt => ({
              id: `o:${opt}`,
              text: opt,
            }));
          }
        }

        if (processedOptions.length === 0 || processedOptions.length < 4) {
          throw new Error(`No valid options found for question ${question.id}`);
        }

        if (processedOptions.length !== 4) {
          processedOptions = processedOptions.slice(0, 4).map((opt, index) => ({
            id: `o${index + 1}:${opt.text}`,
            text: opt.text,
          }));
        }

        return {
          ...question,
          options: processedOptions,
          difficultyLevelId: question.difficultyLevelId || 1,
          questionTypeId: question.questionTypeId || 1,
          timeAllocation: question.timeAllocation || 60,
          formula: question.formula || '',
        };
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
          difficultyLevelId: question.difficultyLevelId || 1,
          questionTypeId: question.questionTypeId || 1,
          timeAllocation: question.timeAllocation || 60,
          formula: question.formula || '',
          correctAnswer: question.correctAnswer || 'Error loading options',
        };
      }
    });

    console.log('Processed questions for quiz:', processed);
    setSelectedSubtopicForQuiz({
      ...subtopic,
      questions: processed,
    });

    needsCompletionRef.current = false;
    setIsQuizModalOpen(true);
  };

  const handleQuestionsUpdate = (updatedQuestions: ProcessedQuestion[]): void => {
    console.log('Updating questions with new data:', updatedQuestions);
    if (selectedSubtopicForQuiz) {
      setSelectedSubtopicForQuiz({
        ...selectedSubtopicForQuiz,
        questions: updatedQuestions,
      });
    }
  };

  const handleSessionIdUpdate = (sessionId: number | null): void => {
    console.log('[DEBUG SESSION] Received session ID update:', sessionId);
    if (sessionId) {
      setActiveSessionId(sessionId);
      needsCompletionRef.current = true;
    } else {
      setActiveSessionId(null);
      needsCompletionRef.current = false;
    }
  };

  const questionUpdateAdapter = (updatedQuestions: QuizQuestion[]): void => {
    handleQuestionsUpdate(updatedQuestions as unknown as ProcessedQuestion[]);
  };

  const handleCloseQuizModal = async (): Promise<void> => {
    if (activeSessionId && needsCompletionRef.current) {
      try {
        const success = await completeTestSession(activeSessionId);
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

    setActiveSessionId(null);
    setIsQuizModalOpen(false);

    setTimeout(() => {
      fetchTopicData(true).then(() => {
        setSelectedSubtopicForQuiz(null);
      });
    }, 500);
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
        <p className="text-gray-600">Please sign in to access math practice.</p>
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
        <button onClick={() => router.push('/maths')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Back to Topics
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white max-w-6xl mx-auto">
      <div className="mb-4">
        <Link href="/maths">
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
              onClick={() => handleStartQuiz(subtopic)}
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
      )}

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
          testSessionId={null}
          apiEndpoints={MATH_ENDPOINTS}
          renderFormula={renderFormula}
          calculateNewStatus={calculateNewStatus}
          subjectType={subjectType}
        />
      )}

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
          </div>
        </div>
      )}
    </div>
  );
}