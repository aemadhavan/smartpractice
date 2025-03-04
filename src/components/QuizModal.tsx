//File: /src/components/QuizModal.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { config, processMathExpression, logMathJaxError } from '../lib/mathjax-config';

type Option = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: Option[];
  correctOption: string;
  explanation: string;
  formula?: string;
  difficultyLevelId: number;
  questionTypeId: number;
  timeAllocation: number;
  attemptCount?: number;
  successRate?: number;
  status?: 'Mastered' | 'Learning' | 'To Start';
  subtopicId: number;
};

// Add a new type to track answered questions with their selected options
type AnsweredQuestion = {
  questionId: number;
  selectedOption: string;
  isCorrect: boolean;
};

type QuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subtopicName: string;
  questions: QuizQuestion[];
  userId: string;
  topicId: number;
  onQuestionsUpdate?: (updatedQuestions: QuizQuestion[]) => void;
  onSessionIdUpdate?: (sessionId: number | null) => void;
  testSessionId?: number | null;
};

const renderOptionText = (optionText: string): string => {
  // Make sure we have a string
  if (typeof optionText !== 'string') {
    return String(optionText);
  }
  
  // For MathJax expressions, ensure proper processing
  const hasMathDelimiters = optionText.includes('\\(') || optionText.includes('\\)') || 
      optionText.includes('\\[') || optionText.includes('\\]') ||
      optionText.includes('$') || optionText.includes('$$');
      
  if (hasMathDelimiters) {
    // Process to ensure proper MathJax delimiters
    return processMathExpression(optionText);
  }
  
  // Clean up any HTML or unwanted characters
  return optionText.trim();
};

const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  subtopicName,
  questions,
  userId,
  topicId,
  onSessionIdUpdate,
  testSessionId: initialTestSessionId
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testSessionId, setTestSessionId] = useState<number | null>(initialTestSessionId || null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  
  // Replace simple Set with Map to track both question IDs and selected options
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  
  const initialSessionIdRef = useRef<number | null>(initialTestSessionId || null);
  const currentQuestionRef = useRef<QuizQuestion | null>(null);
  
  const currentQuestion = questions[currentQuestionIndex] || null;
  
  // Helper to check if current question has been answered
  const getCurrentQuestionAnswer = useCallback(() => {
    if (!currentQuestion) return null;
    return answeredQuestions.find(q => q.questionId === currentQuestion.id) || null;
  }, [currentQuestion, answeredQuestions]);
  
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);
  
  const options = currentQuestion && Array.isArray(currentQuestion.options) 
    ? currentQuestion.options 
    : [];
  
  useEffect(() => {
    if (initialTestSessionId && initialTestSessionId !== testSessionId) {
      console.log('Updating test session ID from prop:', initialTestSessionId);
      setTestSessionId(initialTestSessionId);
      initialSessionIdRef.current = initialTestSessionId;
    }
  }, [initialTestSessionId, testSessionId]);
  
  const completeTestSession = useCallback(async () => {
    if (!testSessionId || isCompletingSession) return;
    
    try {
      setIsCompletingSession(true);
      console.log('Completing test session:', testSessionId);
      
      const response = await fetch('/api/quantitative/complete-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testSessionId,
          userId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Successfully completed test session:', result);
        setTestSessionId(null);
      } else {
        console.error('Failed to complete test session:', await response.text());
      }
    } catch (error) {
      console.error('Error completing test session:', error);
    } finally {
      setIsCompletingSession(false);
    }
  }, [testSessionId, userId, isCompletingSession]);
  
  const handleClose = useCallback(() => {
    if (testSessionId) {
      completeTestSession().then(() => {
        setTestSessionId(null);
        setAnsweredQuestions([]);
        onClose();
      });
    } else {
      onClose();
    }
  }, [testSessionId, completeTestSession, onClose]);
  
  // Effect to handle question changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestion) {
      setTimeLeft(currentQuestion.timeAllocation);
      
      // Check if we already have an answer for this question
      const previousAnswer = getCurrentQuestionAnswer();
      
      if (previousAnswer) {
        // If we've answered this question before, restore the selected option and answer state
        setSelectedOption(previousAnswer.selectedOption);
        setIsAnswered(true);
        setAnswerResult(previousAnswer.isCorrect);
      } else {
        // Reset for a new question
        setSelectedOption(null);
        setIsAnswered(false);
        setAnswerResult(null);
      }
      
      setIsSubmitting(false);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions, currentQuestion, getCurrentQuestionAnswer]);
  
  useEffect(() => {
    if (onSessionIdUpdate) {
      onSessionIdUpdate(testSessionId);
    }
  }, [testSessionId, onSessionIdUpdate]);

  useEffect(() => {
    if (!isOpen || isPaused || isAnswered || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, isPaused, isAnswered, timeLeft]);
  
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      setIsAnswered(true);
    }
  }, [timeLeft, isAnswered]);

  useEffect(() => {
    if (isOpen) {
      if (initialSessionIdRef.current && !testSessionId) {
        console.log('Setting test session ID from initial prop:', initialSessionIdRef.current);
        setTestSessionId(initialSessionIdRef.current);
      }
    } else {
      // Don't reset answered questions when closing - only when explicitly told to
    }
  }, [isOpen, testSessionId]);
  
  useEffect(() => {
    return () => {
      if (isOpen && testSessionId) {
        completeTestSession();
      }
    };
  }, [isOpen, testSessionId, completeTestSession]);

  // Initial setup when the quiz opens
  useEffect(() => {
    if (isOpen && currentQuestion) {
      const existingAnswer = getCurrentQuestionAnswer();
      
      if (existingAnswer) {
        // If we've already answered this question, restore the state
        setSelectedOption(existingAnswer.selectedOption);
        setIsAnswered(true);
        setAnswerResult(existingAnswer.isCorrect);
        console.log(`Restoring previous answer for question ${currentQuestion.id}:`, existingAnswer);
      } else {
        // New question setup
        setSelectedOption(null);
        setIsAnswered(false);
        setIsSubmitting(false);
        setTimeLeft(currentQuestion.timeAllocation);
        setIsPaused(false);
        setQuestionStartTime(Date.now());
        setAnswerResult(null);
      }
    }
  }, [isOpen, currentQuestion, getCurrentQuestionAnswer]);

  if (!isOpen || !currentQuestion) return null;
  
  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
  };
  
  const handleSubmitAnswer = async () => {
    if (!selectedOption || isSubmitting) return;
    
    // Check if we already answered this question
    const existingAnswer = answeredQuestions.find(q => q.questionId === currentQuestion.id);
    if (existingAnswer) {
      console.log(`Question ${currentQuestion.id} already answered in this session, using cached result`);
      setSelectedOption(existingAnswer.selectedOption);
      setIsAnswered(true);
      setAnswerResult(existingAnswer.isCorrect);
      return;
    }
    
    setIsSubmitting(true);
    setIsAnswered(true);
    
    // Enhanced comparison logic for option matching
    const normalizedSelected = String(selectedOption).trim();
    const normalizedCorrect = String(currentQuestion.correctOption).trim();
    
    // Log both values for debugging
    console.log('Comparing selected option to correct option:', {
      selected: normalizedSelected,
      correct: normalizedCorrect
    });
    
    // Do direct string comparison for option IDs
    const isCorrect = normalizedSelected === normalizedCorrect;
    
    // Set the answer result ONCE and use this for UI rendering
    setAnswerResult(isCorrect);
    
    console.log('Answer comparison result:', {
      selected: normalizedSelected,
      correct: normalizedCorrect,
      isMatch: isCorrect
    });
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    const payload = {
      userId,
      questionId: currentQuestion.id,
      topicId,
      subtopicId: currentQuestion.subtopicId,
      isCorrect,
      userAnswer: selectedOption,
      timeSpent: timeSpent,
      testSessionId: testSessionId
    };
    
    console.log('Submitting attempt with payload:', payload);
    
    try {
      await fetch('/api/quantitative/track-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Store the answered question with its selected option
      setAnsweredQuestions(prev => [
        ...prev.filter(q => q.questionId !== currentQuestion.id),
        {
          questionId: currentQuestion.id,
          selectedOption: selectedOption,
          isCorrect: isCorrect
        }
      ]);
      
    } catch (error) {
      console.error('Failed to record attempt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (testSessionId) {
        completeTestSession().then(() => {
          onClose();
        });
      } else {
        onClose();
      }
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  const getQuestionStatus = () => {
    return currentQuestion.status || 'To Start';
  };
  
  // Get list of answered question IDs for debugging
  const answeredQuestionIds = answeredQuestions.map(q => q.questionId);
  
  // Create an enhanced config that includes the typeset option
  const enhancedConfig = {
    ...config,
    startup: {
      ...config.startup,
      typeset: true
    }
  };
  
  return (
    <MathJaxContext version={3} config={enhancedConfig}>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {subtopicName}: Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <button 
              className="text-gray-500 hover:text-gray-700 text-2xl"
              onClick={handleClose}
            >
              &times;
            </button>
          </div>

          {/* Timer and Status */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className={`inline-block px-3 py-1 rounded ${
                timeLeft > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              } font-medium text-sm`}>
                Time: {formatTime(timeLeft)}
              </span>
              <button
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </div>
            <span className={`inline-block px-3 py-1 rounded ${
              getQuestionStatus() === 'Mastered' ? 'bg-green-100 text-green-800' :
              getQuestionStatus() === 'Learning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            } font-medium text-sm`}>
              {getQuestionStatus()}
            </span>
          </div>

          {/* Test Session ID - displaying in all environments */}
          <div className="mb-4 text-xs text-gray-500">
            Session ID: {testSessionId || 'Not set yet'} | 
            Answered: {answeredQuestionIds.join(', ')}
          </div>

          {/* Question */}
          <div className="mb-6 p-5 bg-gray-50 rounded-lg shadow-inner">
            <MathJax
              renderMode="post"
              onError={(error) => logMathJaxError(error, currentQuestion.question)}
            >
              <div className="text-lg text-gray-800" dangerouslySetInnerHTML={{ __html: currentQuestion.question }} />
            </MathJax>
          </div>

          {/* Options */}
          <div className="mb-6 space-y-3">
        {options.length > 0 ? (
          options.map((option) => {
            // For debugging in development mode
            if (process.env.NODE_ENV === 'development') {
              console.log(`Rendering option: id=${option.id}, text=${option.text}`);
            }
            
            return (
              <div 
                key={option.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  !isAnswered && selectedOption === option.id ? 'border-blue-500 bg-blue-50' :
                  isAnswered && option.id === currentQuestion.correctOption ? 'border-green-500 bg-green-50' :
                  isAnswered && selectedOption === option.id && option.id !== currentQuestion.correctOption ? 'border-red-500 bg-red-50' :
                  'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <MathJax
                  renderMode="post"
                  onError={(error) => logMathJaxError(error, option.text)}
                >
                  <div 
                    className="text-base text-gray-800" 
                    dangerouslySetInnerHTML={{ 
                      __html: renderOptionText(option.text) 
                    }} 
                  />
                </MathJax>
              </div>
            );
          })
        ) : (
          <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-base">
            No options available for this question. Please check the data format.
          </div>
        )}
      </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            {!isAnswered ? (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                onClick={handleSubmitAnswer}
                disabled={!selectedOption || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 transition-colors"
                onClick={handleNextQuestion}
                disabled={isCompletingSession}
              >
                {isCompletingSession ? 'Finishing...' : 
                  currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </div>

          {/* Explanation (shown after answering) */}
          {isAnswered && (
            <div className={`mt-6 p-5 rounded-lg shadow-inner ${
              answerResult === true ? 'bg-green-50 border-green-200' : 
              answerResult === false ? 'bg-red-50 border-red-200' : 
              'bg-gray-50 border-gray-200'
            }`}>
              <h3 className="font-bold mb-3 text-lg text-gray-900">
                {answerResult === true ? 'Correct!' : 
                 answerResult === false ? 'Incorrect' : 
                 'Answer'}
              </h3>

              {/* Formula displayed with MathJax component */}
              {currentQuestion.formula && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <MathJax
                    renderMode="post"
                    onError={(error) => logMathJaxError(error, currentQuestion.formula || '')}
                  >
                    <div className="text-base text-gray-800" dangerouslySetInnerHTML={{ 
                      __html: processMathExpression(currentQuestion.formula)
                    }} />
                  </MathJax>
                </div>
              )}

              {/* Process explanation text with proper math expression handling */}
              <MathJax
                renderMode="post"
                onError={(error) => logMathJaxError(error, currentQuestion.explanation)}
              >                
                <div 
                  className="text-base text-gray-800" 
                  dangerouslySetInnerHTML={{ 
                    __html: processMathExpression(currentQuestion.explanation)
                  }} 
                />
              </MathJax>
            </div>
          )}
        </div>
      </div>
    </MathJaxContext>
  );
};

export default QuizModal;