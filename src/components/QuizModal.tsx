//File: src/components/QuizModal.ts

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  subtopicId: number; // Added for tracking attempts
};

type QuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subtopicName: string;
  questions: QuizQuestion[];
  userId: string;
  topicId: number;
  onQuestionsUpdate?: (updatedQuestions: QuizQuestion[]) => void; // Optional prop
  onSessionIdUpdate?: (sessionId: number | null) => void; // For session ID tracking
  testSessionId?: number | null; // Accept the initialized test session ID from parent
};

const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  subtopicName,
  questions,
  userId,
  topicId,
  onQuestionsUpdate,
  onSessionIdUpdate,
  testSessionId: initialTestSessionId // Renamed to avoid conflict with state
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use the initial value provided by the parent if available
  const [testSessionId, setTestSessionId] = useState<number | null>(initialTestSessionId || null);
  // Track the start time for the current question
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  // Track which questions have been answered in this session
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<number>>(new Set());
  // Track if we're completing a session
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);

  
  // Reference to track initial session ID
  const initialSessionIdRef = useRef<number | null>(initialTestSessionId || null);
  // Current question reference for use in effects
  const currentQuestionRef = useRef<QuizQuestion | null>(null);
  
  // Safe access to current question
  const currentQuestion = questions[currentQuestionIndex] || null;
  
  // Update currentQuestionRef whenever the current question changes
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);
  
  // Make sure options exist and are in the expected format
  const options = currentQuestion && Array.isArray(currentQuestion.options) 
    ? currentQuestion.options 
    : [];
  
  // Update testSessionId state when initialTestSessionId prop changes
  useEffect(() => {
    if (initialTestSessionId && initialTestSessionId !== testSessionId) {
      console.log('Updating test session ID from prop:', initialTestSessionId);
      setTestSessionId(initialTestSessionId);
      initialSessionIdRef.current = initialTestSessionId;
    }
  }, [initialTestSessionId, testSessionId]);
  
  // Function to complete a test session
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
        
        // Clear the session ID after successful completion
        setTestSessionId(null);
        // The effect will notify the parent about this change
      } else {
        console.error('Failed to complete test session:', await response.text());
      }
    } catch (error) {
      console.error('Error completing test session:', error);
    } finally {
      setIsCompletingSession(false);
    }
  }, [testSessionId, userId, isCompletingSession]);
  
  // Modified close handler to complete session
  const handleClose = useCallback(() => {
    if (testSessionId) {
      completeTestSession().then(() => {
        setTestSessionId(null);
        setAnsweredQuestionIds(new Set());
        onClose();
      });
    } else {
      onClose();
    }
  }, [testSessionId, completeTestSession, onClose]);
  
  // Reset state when questions change or when a new question is loaded
  useEffect(() => {
    if (questions.length > 0 && currentQuestion) {
      setTimeLeft(currentQuestion.timeAllocation);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsSubmitting(false);
      // Record the start time for the question
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions, currentQuestion]);
  
  // Notify parent of session ID changes
  useEffect(() => {
    // Only call if the prop is provided
    if (onSessionIdUpdate) {
      onSessionIdUpdate(testSessionId);
    }
  }, [testSessionId, onSessionIdUpdate]);

  // Timer effect
  useEffect(() => {
    if (!isOpen || isPaused || isAnswered || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, isPaused, isAnswered, timeLeft]);
  
  // Effect to handle when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      setIsAnswered(true);
    }
  }, [timeLeft, isAnswered]);

  // Add a debugging useEffect
  useEffect(() => {
    console.log('Quiz state updated:', {
      selectedOption,
      isAnswered,
      isSubmitting,
      testSessionId,
      initialTestSessionId,
      answeredQuestionIds: Array.from(answeredQuestionIds)
    });
  }, [selectedOption, isAnswered, isSubmitting, testSessionId, initialTestSessionId, answeredQuestionIds]);

  // Effect to preserve the session ID when the quiz is opened
  useEffect(() => {
    if (isOpen) {
      // If we have an initial session ID, use it
      if (initialSessionIdRef.current && !testSessionId) {
        console.log('Setting test session ID from initial prop:', initialSessionIdRef.current);
        setTestSessionId(initialSessionIdRef.current);
      }
    } else {
      // Reset when quiz closes but don't lose the initial reference
      setAnsweredQuestionIds(new Set());
    }
  }, [isOpen, testSessionId]);
  
  // Cleanup effect to ensure session is completed if component unmounts
  useEffect(() => {
    return () => {
      if (isOpen && testSessionId) {
        completeTestSession();
      }
    };
  }, [isOpen, testSessionId, completeTestSession]);

  // Effect to initialize question state when a question loads
  useEffect(() => {
    // Reset states when a new question loads
    if (isOpen && currentQuestion) {
      setSelectedOption(null);
      setIsAnswered(false);
      setIsSubmitting(false);
      setTimeLeft(currentQuestion.timeAllocation);
      setIsPaused(false);
      setQuestionStartTime(Date.now());
      setAnswerResult(null); // Reset the answer result
      
      // Debug output to make sure we're starting fresh
      console.log('Question loaded:', {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        correctOption: currentQuestion.correctOption,
        selectedOption: null,
        isAnswered: false,
        testSessionId,
        alreadyAnswered: answeredQuestionIds.has(currentQuestion.id)
      });
      
      // If this question has already been answered in this session, show the answer
      if (answeredQuestionIds.has(currentQuestion.id)) {
        console.log(`Question ${currentQuestion.id} was already answered in this session`);
        setIsAnswered(true);
      }
    }
  }, [isOpen, currentQuestion, currentQuestionIndex, testSessionId, answeredQuestionIds]);

  // Early return if modal is closed or no question is available
  if (!isOpen || !currentQuestion) return null;
  
  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
  };
  
  // Debug function to log question status
  const logQuestionStatus = () => {
    // Get all attempts for the current question
    const attempts = questions.filter(q => q.id === currentQuestion.id);
    
    if (attempts.length > 0) {
      const question = attempts[0];
      const attemptCount = question.attemptCount || 0;
      const successRate = question.successRate || 0;
      const status = question.status || 'To Start';
      
      console.log('QUESTION STATUS CHECK:', {
        questionId: question.id,
        attemptCount: attemptCount,
        successRate: successRate,
        status: status,
        shouldBeMastered: successRate >= 0.8,
        currentCalculation: `${successRate >= 0.8 ? 'Mastered' : attemptCount > 0 ? 'Learning' : 'To Start'}`,
        testSessionId,
        alreadyAnswered: answeredQuestionIds.has(question.id)
      });
    }
  };

  const handleSubmitAnswer = async () => {
    logQuestionStatus(); // Log status before submission
  
    if (!selectedOption || isSubmitting) return;
    
    // Check if this question has already been answered in this session
    if (answeredQuestionIds.has(currentQuestion.id)) {
      console.log(`Question ${currentQuestion.id} already answered in this session, skipping submission`);
      setIsAnswered(true);
      return;
    }
    
    setIsSubmitting(true);
    setIsAnswered(true);
    
    // Calculate if the answer is correct and LOCK this value
    const normalizedSelected = String(selectedOption).trim();
    const normalizedCorrect = String(currentQuestion.correctOption).trim();
    const isCorrect = normalizedSelected === normalizedCorrect;
    
    // Store the answer result in state to keep it consistent
    setAnswerResult(isCorrect);
    
    console.log('Answer comparison:', {
      selected: normalizedSelected,
      correct: normalizedCorrect,
      isMatch: isCorrect
    });
    
    // Calculate time spent on this question
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Create the payload with testSessionId if available
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
      // Record the attempt
      const response = await fetch('/api/quantitative/track-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Rest of your existing API handling code...
      
    } catch (error) {
      console.error('Failed to record attempt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setAnswerResult(null); // Reset the answer result
    } else {
      // This is the last question, complete the session before closing
      if (testSessionId) {
        completeTestSession().then(() => {
          onClose(); // End of quiz after completing session
        });
      } else {
        onClose(); // End of quiz
      }
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Safely get status with fallback
  const getQuestionStatus = () => {
    return currentQuestion.status || 'To Start';
  };
  
  const isCorrect = selectedOption === currentQuestion.correctOption;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-90vh overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {subtopicName}: Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={handleClose} // Use handleClose instead of onClose
          >
            &times;
          </button>
        </div>
        
        {/* Timer */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <span className={`inline-block px-3 py-1 rounded ${
              timeLeft > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              Time: {formatTime(timeLeft)}
            </span>
            <button
              className="ml-2 px-3 py-1 text-sm bg-gray-200 rounded"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
          <div>
            <span className={`inline-block px-3 py-1 rounded ${
              getQuestionStatus() === 'Mastered' ? 'bg-green-100 text-green-800' :
              getQuestionStatus() === 'Learning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getQuestionStatus()}
            </span>
          </div>
        </div>
        
        {/* Test Session ID (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-2 text-xs text-gray-500">
            Session ID: {testSessionId || 'Not set yet'} | 
            Answered: {Array.from(answeredQuestionIds).join(', ')}
          </div>
        )}
        
        {/* Question */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div dangerouslySetInnerHTML={{ __html: currentQuestion.question }} />
          {currentQuestion.formula && (
            <div className="mt-2 text-gray-600 border-t pt-2">
              <div dangerouslySetInnerHTML={{ __html: currentQuestion.formula }} />
            </div>
          )}
        </div>
        
        {/* Options */}
        <div className="mb-6 space-y-3">
          {options.length > 0 ? (
            options.map((option) => (
              <div 
                key={option.id}
                className={`p-3 rounded-lg border cursor-pointer ${
                  !isAnswered && selectedOption === option.id ? 'border-blue-500 bg-blue-50' :
                  isAnswered && option.id === currentQuestion.correctOption ? 'border-green-500 bg-green-50' :
                  isAnswered && selectedOption === option.id ? 'border-red-500 bg-red-50' :
                  'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div dangerouslySetInnerHTML={{ __html: option.text }} />
              </div>
            ))
          ) : (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
              No options available for this question. Please check the data format.
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between">
          {!isAnswered ? (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
              onClick={handleSubmitAnswer}
              disabled={!selectedOption || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-green-400"
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
            <div className={`mt-6 p-4 rounded-lg ${
              // Use the stored result when available, otherwise fall back to the current comparison
              (answerResult !== null) ? (answerResult ? 'bg-green-50' : 'bg-red-50') : 
              (selectedOption === currentQuestion.correctOption ? 'bg-green-50' : 'bg-red-50')
            }`}>
              <h3 className="font-bold mb-2">
                {(answerResult !== null) ? (answerResult ? 'Correct!' : 'Incorrect') : 
                (selectedOption === currentQuestion.correctOption ? 'Correct!' : 'Incorrect')}
              </h3>
              <div dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />
            </div>
          )}
      </div>
    </div>
  );
};

export default QuizModal;