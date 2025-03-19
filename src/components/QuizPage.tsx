// File: /src/components/QuizPage.tsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Option, formatOptionText } from '@/lib/options';
import FixedQuizMathRenderer from './math/FixedQuizMathRenderer';
import ImprovedLatexRenderer from './ImprovedLatexRenderer';
import sessionManager from '@/lib/session-manager';
import { MathJax } from 'better-react-mathjax';
import MathFormula from './MathFormula';
import { useMathJax, containsLatex } from '@/hooks/useMathJax';
import QuizSummary from './QuizSummary';


// Define the QuizQuestion type
export type QuizQuestion = {
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

// Define the QuizQuestionResult type to include user answers
export type QuizQuestionResult = QuizQuestion & {
  userAnswer: string;
};

// API endpoints configuration
interface ApiEndpoints {
  initSession: string;
  trackAttempt: string;
  completeSession: string;
}

// QuizPage props
type QuizPageProps = {
  subtopicName: string;
  questions: QuizQuestion[];
  userId: string;
  topicId: number;
  onQuestionsUpdate?: (questions: QuizQuestion[]) => void;
  onSessionIdUpdate?: (sessionId: number | null) => void;
  testSessionId?: number | null;
  apiEndpoints: ApiEndpoints;
  renderFormula?: (formula: string) => React.ReactNode;
  calculateNewStatus?: (
    question: QuizQuestion, 
    isCorrect: boolean, 
    successRate: number
  ) => 'Mastered' | 'Learning' | 'To Start';
  subjectType: 'maths' | 'quantitative';
};

const QuizPage: React.FC<QuizPageProps> = ({
  subtopicName,
  questions,
  userId,
  topicId,
  onQuestionsUpdate,
  onSessionIdUpdate,
  testSessionId,
  apiEndpoints,
  calculateNewStatus,
  subjectType
}) => {
  const router = useRouter();
  
  // Core quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [results, setResults] = useState<{
    correctCount: number;
    totalCount: number;
    questions: QuizQuestionResult[];
  }>({
    correctCount: 0,
    totalCount: 0,
    questions: []
  });
  
  // Session and quiz completion state
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showQuizSummary, setShowQuizSummary] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  // For debugging purposes only
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_timeSpentOnQuestion, setTimeSpentOnQuestion] = useState<number>(0);
  
  // UI state
  const [contentLoading, setContentLoading] = useState(true);
  
  // Session initialization ref
  const sessionInitializationRef = useRef<boolean>(false);
  
  // Memoize current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => 
    questions[currentQuestionIndex] || null, 
    [questions, currentQuestionIndex]
  );
  
  // Set up MathJax processing with a single hook call
  const { /* containerRef */ } = useMathJax(
    [
      currentQuestionIndex,
      currentQuestion?.question,
      currentQuestion?.options?.map(o => o.text).join(''),
      currentQuestion?.explanation,
      isAnswerSubmitted
    ],
    {
      delay: 100,
      fallbackDelay: 1000,
      debugLabel: `${subjectType}-question`,
      onProcessed: () => {
        setContentLoading(false);
      }
    }
  );
  
  // Initialize session when component mounts
  useEffect(() => {
    if (questions.length === 0 || currentSessionId) return;
    
    const initSession = async () => {
      try {
        // Prevent multiple initializations
        if (sessionInitializationRef.current) return;
        sessionInitializationRef.current = true;
        
        const sessionId = await sessionManager.initSession(
          userId,
          questions[0].subtopicId,
          apiEndpoints.initSession
        );
        
        if (sessionId) {
          setCurrentSessionId(sessionId);
          if (onSessionIdUpdate) {
            onSessionIdUpdate(sessionId);
          }
        } else {
          setInitError('Failed to initialize session');
        }
      } catch (error) {
        console.error(`[${subjectType}] Error initializing test session:`, error);
        setInitError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    initSession();
  }, [questions, userId, apiEndpoints.initSession, currentSessionId, subjectType, onSessionIdUpdate]);
  
  // Handle testSessionId changes from parent if provided
  useEffect(() => {
    if (testSessionId && testSessionId !== currentSessionId && !sessionInitializationRef.current) {
      setCurrentSessionId(testSessionId);
    }
  }, [testSessionId, currentSessionId]);
  
  // Initialize timer when question changes
  useEffect(() => {
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeAllocation);
      setQuestionStartTime(Date.now());
      setIsPaused(false);
      setContentLoading(true);
    }
  }, [currentQuestion]);
  
  // Provide a safety fallback for content display
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (contentLoading) {
        console.log(`[${subjectType}] Fallback timer triggered for content`);
        setContentLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(fallbackTimer);
  }, [currentQuestionIndex, subjectType, contentLoading]);
  
  // Timer effect
  useEffect(() => {
    if (isPaused || isAnswerSubmitted || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPaused, isAnswerSubmitted, timeLeft]);
  
  // Update time spent for debugging
  useEffect(() => {
    if (isPaused || isAnswerSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeSpentOnQuestion(Math.round((Date.now() - questionStartTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [questionStartTime, isPaused, isAnswerSubmitted]);
  
  // Function to check the answer
  const checkAnswer = useCallback(async () => {
    if (!selectedOption || isAnswerSubmitted || !currentQuestion) return;
    
    // Get values
    const correctAnswerValue = currentQuestion.correctAnswer;
    const selectedOptionValue = currentQuestion.options.find(opt => opt.id === selectedOption)?.text || '';
    
    // Check if correct
    const isCorrect = correctAnswerValue === selectedOptionValue;
    
    // Update state
    setIsAnswerSubmitted(true);
    setIsAnswerCorrect(isCorrect);
    
    // Add to results
    setResults(prev => ({
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      totalCount: prev.totalCount + 1,
      questions: [
        ...prev.questions,
        {
          ...currentQuestion,
          userAnswer: selectedOptionValue
        }
      ]
    }));
    
    // Calculate time spent
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Submit to API
    if (currentSessionId) {
      try {
        await sessionManager.trackAttempt(
          {
            userId,
            questionId: currentQuestion.id,
            topicId,
            subtopicId: currentQuestion.subtopicId,
            isCorrect,
            userAnswer: selectedOptionValue,
            timeSpent
          },
          apiEndpoints.trackAttempt
        );
      } catch (error) {
        console.error(`[${subjectType}] Error submitting answer:`, error);
      }
    }
  }, [
    selectedOption, 
    isAnswerSubmitted, 
    currentQuestion, 
    questionStartTime, 
    currentSessionId, 
    userId, 
    topicId, 
    apiEndpoints.trackAttempt,
    subjectType
  ]);
  
  // Auto-submit when timer runs out
  useEffect(() => {
    if (timeLeft === 0 && !isAnswerSubmitted && selectedOption) {
      checkAnswer();
    }
  }, [timeLeft, isAnswerSubmitted, selectedOption, checkAnswer]);
  
  // Function to handle option selection
  const handleOptionSelect = useCallback((optionId: string) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionId);
    }
  }, [isAnswerSubmitted]);
  
  // Function to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Function to toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);
  
  // Function to move to the next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex === questions.length - 1) {
      setIsQuizCompleted(true);
      setShowQuizSummary(false);
      return;
    }
    
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsAnswerCorrect(false);
    setContentLoading(true);
  }, [currentQuestionIndex, questions.length]);
  
  // Default status calculation function
  const defaultCalculateNewStatus = (
    question: QuizQuestion, 
    isCorrect: boolean, 
    newSuccessRate: number
  ): 'Mastered' | 'Learning' | 'To Start' => {
    if (isCorrect) {
      if (question.status === 'To Start') return 'Learning';
      if (question.status === 'Learning' && newSuccessRate >= 70) return 'Mastered';
    } else {
      if (question.status === 'Mastered') return 'Learning';
      if (question.status === 'Learning' && newSuccessRate < 40) return 'To Start';
    }
    return question.status;
  };

  // Function to complete the quiz
  const completeQuiz = useCallback(async () => {
    setShowQuizSummary(true);
    
    // Calculate updated questions
    const updatedQuestions = questions.map((question, index) => {
      if (index < results.questions.length) {
        const resultQuestion = results.questions[index];
        const isCorrect = resultQuestion.correctAnswer === resultQuestion.userAnswer;
        
        const totalAttempts = question.attemptCount + 1;
        const oldSuccessCount = Math.round(question.successRate * question.attemptCount / 100);
        const newSuccessCount = oldSuccessCount + (isCorrect ? 1 : 0);
        const newSuccessRate = totalAttempts > 0 
          ? (newSuccessCount / totalAttempts) * 100 
          : 0;
        
        const newStatus = calculateNewStatus 
          ? calculateNewStatus(question, isCorrect, newSuccessRate)
          : defaultCalculateNewStatus(question, isCorrect, newSuccessRate);
        
        return {
          ...question,
          status: newStatus,
          attemptCount: totalAttempts,
          successRate: newSuccessRate
        };
      }
      
      return question;
    });
    
    // Update questions in parent
    if (onQuestionsUpdate) {
      try {
        onQuestionsUpdate(updatedQuestions);
      } catch (error) {
        console.error(`[${subjectType}] Error updating questions:`, error);
      }
    }
    
    // Complete the session
    if (currentSessionId) {
      try {
        const completed = await sessionManager.completeSession(userId, apiEndpoints.completeSession);
        
        if (completed) {
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
          
          setCurrentSessionId(null);
          sessionInitializationRef.current = false;
        }
      } catch (error) {
        console.error(`[${subjectType}] Error completing test session:`, error);
      }
    }
  }, [
    questions, 
    results, 
    onQuestionsUpdate, 
    currentSessionId, 
    userId, 
    apiEndpoints.completeSession, 
    onSessionIdUpdate, 
    calculateNewStatus, 
    subjectType
  ]);
  
  // Function to go back to topics page
  const goBackToTopics = useCallback(() => {
    if (currentSessionId) {
      try {
        fetch(apiEndpoints.completeSession, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testSessionId: currentSessionId,
            userId
          })
        }).then(response => {
          if (response.ok) {
            console.log(`[${subjectType}] Session completed on navigation`);
          } else {
            console.warn(`[${subjectType}] Failed to complete session on navigation`);
          }
          
          setCurrentSessionId(null);
          sessionInitializationRef.current = false;
          
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
          
          router.push(`/${subjectType}/topics/${topicId}`);
        });
      } catch (error) {
        console.error(`[${subjectType}] Error completing session on navigation:`, error);
        router.push(`/${subjectType}/topics/${topicId}`);
      }
    } else {
      router.push(`/${subjectType}/topics/${topicId}`);
    }
  }, [currentSessionId, apiEndpoints.completeSession, userId, subjectType, onSessionIdUpdate, router, topicId]);
  
  // Memoized option text renderer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _renderOptionText = useCallback((text: string | Option | null | undefined) => {
    // Get the text value
    let textValue: string;
    
    if (typeof text === 'string') {
      textValue = text;
    } else if (typeof text === 'object' && text && 'text' in text) {
      textValue = String((text as Option).text);
    } else {
      textValue = text ? String(text) : '';
    }
    
    textValue = formatOptionText ? formatOptionText(textValue) : textValue;
    
    // Handle different content types
    if (/^\$\d+(\.\d+)?$/.test(textValue)) {
      return <span className="currency-value">{textValue}</span>;
    }
    
    if (containsLatex(textValue)) {
      return <ImprovedLatexRenderer formula={textValue} />;
    }
    
    return <FixedQuizMathRenderer content={textValue} />;
  }, []);

  // Show initialization error
  if (initError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Session Initialization Error</h2>
          <div className="bg-red-50 p-4 rounded-lg mb-4 text-red-700">
            <p className="font-medium">Failed to start quiz session</p>
            <p className="text-sm mt-1">{initError}</p>
            <p className="text-sm mt-2">Check your network connection and try again.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={goBackToTopics}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <div className="p-4 flex items-center">
        <button 
          onClick={goBackToTopics}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Topics
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        {/* Quiz content */}
        {!isQuizCompleted ? (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {subtopicName} - Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            
            {/* Timer and status display */}
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-3 py-1 rounded ${
                  timeLeft > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                } font-medium text-sm`}>
                  Time: {formatTime(timeLeft)}
                </span>
                <button
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  onClick={togglePause}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
              <span className={`inline-block px-3 py-1 rounded ${
                currentQuestion.status === 'Mastered' ? 'bg-green-100 text-green-800' :
                currentQuestion.status === 'Learning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              } font-medium text-sm`}>
                {currentQuestion.status}
              </span>
            </div>

            {/* Session ID display - can be hidden in production */}
            {/* <div className="mb-4 text-xs text-gray-500">
              Session ID: {currentSessionId || 'Not set yet'} | 
              Answered: {results.totalCount} |
              Time spent: {timeSpentOnQuestion}s |
              MathJax: {isProcessing ? 'Processing...' : isProcessed ? 'Processed' : 'Waiting...'}
            </div> */}
            
            {/* Question */}
            <div className="mb-6 question-container">
              {contentLoading ? (
                <>
                  <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2"></div>
                </>
              ) : (
                <div className="text-lg">
                  <FixedQuizMathRenderer content={currentQuestion.question} />
                </div>
              )}
              
              {currentQuestion.formula && !contentLoading && (
                <div className="formula-container mt-2">
                  <MathFormula formula={currentQuestion.formula} />
                </div>
              )}
            </div>
            
            {/* Options */}
            <div className="space-y-3 mb-6 options-container" style={{ 
                opacity: contentLoading ? 0.6 : 1,
                transition: 'opacity 0.3s ease-in-out'
              }}>
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      contentLoading ? 'pointer-events-none' : ''
                    } ${
                      selectedOption === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${
                      isAnswerSubmitted && option.text === currentQuestion.correctAnswer
                        ? 'bg-green-50 border-green-500'
                        : ''
                    } ${
                      isAnswerSubmitted && 
                      selectedOption === option.id && 
                      option.text !== currentQuestion.correctAnswer
                        ? 'bg-red-50 border-red-500'
                        : ''
                    }`}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    {contentLoading ? (
                      <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4"></div>
                    ) : (
                      <div className="option-text-container">
                        {option.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            
            {/* Explanation (shown after answering) */}
            {isAnswerSubmitted && (
              <div className={`p-4 mb-6 rounded ${isAnswerCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="font-medium mb-2">
                  {isAnswerCorrect ? 'Correct!' : 'Incorrect!'}
                </div>
                <div>
                  <MathJax hideUntilTypeset="first">
                    {currentQuestion.explanation}
                  </MathJax>
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-between">
              <div>
                {/* Current progress */}
                <div className="text-sm text-gray-500">
                  {results.correctCount} correct of {results.totalCount} answered
                </div>
              </div>
              
              <div className="space-x-3">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={checkAnswer}
                    disabled={!selectedOption || contentLoading}
                    className={`px-4 py-2 rounded ${
                      selectedOption && !contentLoading
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {contentLoading ? 'Loading...' : 'Check Answer'}
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    {currentQuestionIndex === questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Quiz completed summary */}
            {!showQuizSummary ? (
              <div className="text-center py-6">
                <h3 className="text-xl font-semibold mb-4">Quiz Completed!</h3>
                <p className="mb-6">
                  You scored {results.correctCount} out of {questions.length} questions.
                </p>
                <div className="text-lg font-medium mb-2">
                  {(results.correctCount / questions.length) * 100 >= 80
                    ? 'Great job! 🎉'
                    : (results.correctCount / questions.length) * 100 >= 60
                    ? 'Good effort! 👍'
                    : 'Keep practicing! 💪'}
                </div>
                <button
                  onClick={completeQuiz}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  View Summary
                </button>
              </div>
            ) : (
              <QuizSummary 
        questions={results.questions}
        correctCount={results.correctCount}
        onBackToTopics={goBackToTopics}
        //onTryAgain={resetQuiz}
        moduleTitle={subtopicName}
      />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;