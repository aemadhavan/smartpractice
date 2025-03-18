/* eslint-disable */
// File: /src/components/EnhancedQuizModal.tsx


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Option, 
  formatOptionText
} from '@/lib/options';
import QuizMathRenderer from '@/components/QuizMathRenderer';
import { processMathExpression } from '@/lib/mathjax-config';

// Define the QuizQuestion type to match the ProcessedQuestion type in page.tsx
export type QuizQuestion = {
  id: number;
  question: string;
  options: Option[]; // Already an array of { id: string; text: string }
  correctAnswer: string; // Keep as text value (e.g., "15", not "o3")
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
type QuizQuestionResult = QuizQuestion & {
  userAnswer: string;
};

// API endpoints configuration to make component reusable
interface ApiEndpoints {
  initSession: string;
  trackAttempt: string;
  completeSession: string;
}

// Enhanced props with configurable API endpoints
type EnhancedQuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subtopicName: string;
  questions: QuizQuestion[];
  userId: string;
  topicId: number;
  onQuestionsUpdate?: (questions: QuizQuestion[]) => void;
  onSessionIdUpdate?: (sessionId: number | null) => void;
  testSessionId?: number | null;
  // New configurable API endpoints
  apiEndpoints: ApiEndpoints;
  // Optional renderer for math formulas
  renderFormula?: (formula: string) => React.ReactNode;
  // Optional custom status calculation function
  calculateNewStatus?: (question: QuizQuestion, isCorrect: boolean, successRate: number) => 'Mastered' | 'Learning' | 'To Start';
  // Subject identifier for analytics
  subjectType: 'maths' | 'quantitative';
};

const EnhancedQuizModalOld: React.FC<EnhancedQuizModalProps> = ({
  isOpen,
  onClose,
  subtopicName,
  questions,
  userId,
  topicId,
  onQuestionsUpdate,
  onSessionIdUpdate,
  testSessionId,
  apiEndpoints,
  renderFormula,
  calculateNewStatus,
  subjectType
}) => {
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
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showQuizSummary, setShowQuizSummary] = useState(false);
  // CRITICAL FIX: Initialize with null not undefined
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Use a ref to track session creation status to prevent race conditions
  const sessionInitializationRef = useRef<boolean>(false);
  
  // Add timer-related state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  
  // Debug state to track time spent calculation
  const [timeSpentOnQuestion, setTimeSpentOnQuestion] = useState<number>(0);
  
  // Reset modal state when opened or closed
  useEffect(() => {
    // When modal opens
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setIsAnswerCorrect(false);
      setResults({
        correctCount: 0,
        totalCount: 0,
        questions: []
      });
      setIsQuizCompleted(false);
      setShowQuizSummary(false);
      setInitError(null);
    } else {
      // When modal closes, reset session initialization status
      // This is critical to allow new sessions to be created on next open
      setTimeout(() => {
        sessionInitializationRef.current = false;
      }, 500);
    }
  }, [isOpen]);
  
  // Initialize session when modal is opened
  useEffect(() => {
    // Don't proceed if modal is closed
    if (!isOpen) return;
    
    // Don't proceed if questions are missing
    if (questions.length === 0) {
      console.log(`[${subjectType}] No questions available, cannot initialize session`);
      return;
    }
    
    // Don't proceed if we already have a session ID
    if (currentSessionId) {
      console.log(`[${subjectType}] Already have session ID:`, currentSessionId);
      return;
    }
    
    // Don't proceed if we've already tried to initialize a session for this modal opening
    if (sessionInitializationRef.current) {
      console.log(`[${subjectType}] Session initialization already in progress`);
      return;
    }
    
    // Mark that we're attempting to initialize a session
    sessionInitializationRef.current = true;
    
    console.log(`[${subjectType}] Initializing new session for subtopic:`, 
      questions[0].subtopicId, 'using endpoint:', apiEndpoints.initSession);
    
    const initSession = async () => {
      try {
        const initResponse = await fetch(apiEndpoints.initSession, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            subtopicId: questions[0].subtopicId
          })
        });
        
        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          console.error(`[${subjectType}] Failed to initialize test session:`, errorText);
          setInitError(`Failed to initialize session: ${initResponse.status} ${errorText}`);
          return;
        }
        
        const initResult = await initResponse.json();
        if (initResult.testAttemptId) {
          console.log(`[${subjectType}] Session initialized with ID:`, initResult.testAttemptId);
          
          // Update state with new session ID
          setCurrentSessionId(initResult.testAttemptId);
          
          // Notify parent component of session ID
          if (onSessionIdUpdate) {
            onSessionIdUpdate(initResult.testAttemptId);
          }
        } else {
          console.error(`[${subjectType}] Invalid response from init-session API:`, initResult);
          setInitError('Invalid response from server');
        }
      } catch (error) {
        console.error(`[${subjectType}] Error initializing test session:`, error);
        setInitError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    // Initialize the session
    initSession();
  }, [isOpen, currentSessionId, questions, userId, apiEndpoints.initSession, subjectType, onSessionIdUpdate]);
  
  // Handle testSessionId changes from parent if provided
  useEffect(() => {
    if (testSessionId && testSessionId !== currentSessionId && !sessionInitializationRef.current) {
      console.log(`[${subjectType}] Using testSessionId from parent:`, testSessionId);
      setCurrentSessionId(testSessionId);
    }
  }, [testSessionId, currentSessionId, subjectType]);
  
  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Initialize timer when question changes
  useEffect(() => {
    if (currentQuestion && isOpen) {
      setTimeLeft(currentQuestion.timeAllocation);
      setQuestionStartTime(Date.now());
      setIsPaused(false);
      
      // Ensure MathJax is typeset when a new question is loaded
      if (typeof window !== 'undefined') {
        // Wait for MathJax to be fully loaded and ready
        const waitForMathJax = () => {
          if ((window as any).mathJaxReady && (window as any).safeTypesetMathJax) {
            // Use the global safe typesetting function
            (window as any).safeTypesetMathJax();
          } else if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
            // Fall back to direct MathJax typesetting
            try {
              (window as any).MathJax.typesetPromise()
                .catch((err: any) => {
                  console.error('MathJax typesetting failed in modal:', err);
                });
            } catch (error) {
              console.error('Error processing MathJax in modal:', error);
            }
          } else {
            // Check again in 100ms
            setTimeout(waitForMathJax, 100);
          }
        };
        
        // Start waiting for MathJax to be ready
        waitForMathJax();
      }
    }
  }, [currentQuestion, currentQuestionIndex, isOpen]);
  
  // Timer effect
  useEffect(() => {
    if (!isOpen || isPaused || isAnswerSubmitted || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, isPaused, isAnswerSubmitted, timeLeft]);
  
  // Debug logging for options and ensure MathJax is typeset when modal is opened
  useEffect(() => {
    if (currentQuestion) {
      console.log(`[${subjectType}] Current question:`, currentQuestion);
      console.log(`[${subjectType}] Options:`, currentQuestion.options.map(o => ({
        id: o.id,
        text: o.text,
        idType: typeof o.id,
        textType: typeof o.text
      })));
      
      // Ensure MathJax is typeset when the modal is opened with a question
      if (typeof window !== 'undefined') {
        // Wait for MathJax to be fully loaded and ready
        const waitForMathJax = () => {
          if ((window as any).mathJaxReady && (window as any).safeTypesetMathJax) {
            // Use the global safe typesetting function
            (window as any).safeTypesetMathJax();
          } else if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
            // Fall back to direct MathJax typesetting
            try {
              (window as any).MathJax.typesetPromise()
                .catch((err: any) => {
                  console.error('MathJax typesetting failed in modal:', err);
                });
            } catch (error) {
              console.error('Error processing MathJax in modal:', error);
            }
          } else {
            // Check again in 100ms
            setTimeout(waitForMathJax, 100);
          }
        };
        
        // Start waiting for MathJax to be ready
        waitForMathJax();
      }
    }
  }, [currentQuestion, subjectType]);
  
  // Function to check the answer - wrapped in useCallback to prevent recreation on every render
  const checkAnswer = useCallback(async () => {
    if (!selectedOption || isAnswerSubmitted || !currentQuestion) return;
    
    // Get the correct answer and selected option values (compare text directly since correctAnswer is text)
    const correctAnswerValue = currentQuestion.correctAnswer;
    const selectedOptionValue = currentQuestion.options.find(opt => opt.id === selectedOption)?.text || '';
    
    // Check if the answer is correct by comparing text values
    const isCorrect = correctAnswerValue === selectedOptionValue;
    
    // Set the answer submission state
    setIsAnswerSubmitted(true);
    setIsAnswerCorrect(isCorrect);
    
    // Ensure MathJax is typeset after showing the explanation
    if (typeof window !== 'undefined') {
      // Wait for MathJax to be fully loaded and ready
      const waitForMathJax = () => {
        if ((window as any).mathJaxReady && (window as any).safeTypesetMathJax) {
          // Use the global safe typesetting function
          (window as any).safeTypesetMathJax();
        } else if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
          // Fall back to direct MathJax typesetting
          try {
            (window as any).MathJax.typesetPromise()
              .catch((err: any) => {
                console.error('MathJax typesetting failed after answer submission:', err);
              });
          } catch (error) {
            console.error('Error processing MathJax after answer submission:', error);
          }
        } else {
          // Check again in 100ms
          setTimeout(waitForMathJax, 100);
        }
      };
      
      // Start waiting for MathJax to be ready
      waitForMathJax();
    }
    
    // Add to results
    setResults(prev => ({
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      totalCount: prev.totalCount + 1,
      questions: [
        ...prev.questions,
        {
          ...currentQuestion,
          // Store the user's answer for later review (store the text value)
          userAnswer: selectedOptionValue
        }
      ]
    }));
    
    // Calculate time spent
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Submit the answer to the API only if we have a session ID
    if (currentSessionId) {
      try {
        console.log(`[${subjectType}] Tracking attempt for question:`, currentQuestion.id, 'with session:', currentSessionId);
        // Use track-attempt to record the answer
        const apiResponse = await fetch(apiEndpoints.trackAttempt, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testSessionId: currentSessionId,
            userId,
            questionId: currentQuestion.id,
            topicId,
            subtopicId: currentQuestion.subtopicId,
            isCorrect,
            userAnswer: selectedOptionValue, // Send the text value of the user's answer
            timeSpent // Real time tracking from questionStartTime
          })
        });
        
        if (!apiResponse.ok) {
          console.error(`[${subjectType}] Failed to submit answer`);
        } else {
          console.log(`[${subjectType}] Answer submitted successfully`);
        }
      } catch (error) {
        console.error(`[${subjectType}] Error submitting answer:`, error);
      }
    } else {
      console.error(`[${subjectType}] Cannot track attempt - no valid session ID`);
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
  
  // Update time spent for debugging
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused && !isAnswerSubmitted) {
        setTimeSpentOnQuestion(Math.round((Date.now() - questionStartTime) / 1000));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [questionStartTime, isPaused, isAnswerSubmitted]);
  
  // Function to handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionId);
    }
  };
  
  // Function to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Function to toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  // Function to move to the next question
  const nextQuestion = () => {
    // If we're at the last question, complete the quiz
    if (currentQuestionIndex === questions.length - 1) {
      setIsQuizCompleted(true);
      
      // The issue is that we need to show the initial completion screen
      // and not directly jump to the summary
      setShowQuizSummary(false);
      
      return;
    }
    
    // Otherwise, move to the next question
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsAnswerCorrect(false);
    
    // Ensure MathJax is typeset after moving to the next question
    if (typeof window !== 'undefined') {
      // Wait for MathJax to be fully loaded and ready
      const waitForMathJax = () => {
        if ((window as any).mathJaxReady && (window as any).safeTypesetMathJax) {
          // Use the global safe typesetting function
          (window as any).safeTypesetMathJax();
        } else if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
          // Fall back to direct MathJax typesetting
          try {
            (window as any).MathJax.typesetPromise()
              .catch((err: any) => {
                console.error('MathJax typesetting failed after question change:', err);
              });
          } catch (error) {
            console.error('Error processing MathJax after question change:', error);
          }
        } else {
          // Check again in 100ms
          setTimeout(waitForMathJax, 100);
        }
      };
      
      // Start waiting for MathJax to be ready
      waitForMathJax();
    }
  };
  
  // Default status calculation function
  const defaultCalculateNewStatus = (question: QuizQuestion, isCorrect: boolean, newSuccessRate: number): 'Mastered' | 'Learning' | 'To Start' => {
    if (isCorrect) {
      // If correct, move up in mastery
      if (question.status === 'To Start') {
        return 'Learning';
      } else if (question.status === 'Learning' && newSuccessRate >= 70) {
        return 'Mastered';
      }
    } else {
      // If incorrect, move down in mastery or stay the same
      if (question.status === 'Mastered') {
        return 'Learning';
      }
    }
    return question.status;
  };

  // Function to complete the quiz
  const completeQuiz = async () => {
    // Set the quiz summary to visible first thing
    setShowQuizSummary(true);
    
    // Ensure MathJax is typeset after showing the summary
    if (typeof window !== 'undefined') {
      // Wait for MathJax to be fully loaded and ready
      const waitForMathJax = () => {
        if ((window as any).mathJaxReady && (window as any).safeTypesetMathJax) {
          // Use the global safe typesetting function
          (window as any).safeTypesetMathJax();
        } else if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
          // Fall back to direct MathJax typesetting
          try {
            (window as any).MathJax.typesetPromise()
              .catch((err: any) => {
                console.error('MathJax typesetting failed in quiz summary:', err);
              });
          } catch (error) {
            console.error('Error processing MathJax in quiz summary:', error);
          }
        } else {
          // Check again in 100ms
          setTimeout(waitForMathJax, 100);
        }
      };
      
      // Start waiting for MathJax to be ready
      waitForMathJax();
    }
    
    // Calculate updated questions scores and mastery status
    const updatedQuestions = questions.map((question, index) => {
      // Only update if this question was answered
      if (index < results.questions.length) {
        const resultQuestion = results.questions[index];
        const isCorrect = resultQuestion.correctAnswer === resultQuestion.userAnswer;
        
        // Calculate new success rate
        const totalAttempts = question.attemptCount + 1;
        const oldSuccessCount = Math.round(question.successRate * question.attemptCount / 100);
        const newSuccessCount = oldSuccessCount + (isCorrect ? 1 : 0);
        const newSuccessRate = totalAttempts > 0 
          ? (newSuccessCount / totalAttempts) * 100 
          : 0;
        
        // Calculate new status
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
    
    // First, update questions in parent component
    if (onQuestionsUpdate) {
      try {
        onQuestionsUpdate(updatedQuestions);
      } catch (error) {
        console.error(`[${subjectType}] Error updating questions:`, error);
      }
    }
    
    // Then, attempt to complete the session with the API
    if (currentSessionId) {
      try {
        console.log(`[${subjectType}] Completing test session:`, currentSessionId);
        const completeResponse = await fetch(apiEndpoints.completeSession, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testSessionId: currentSessionId,
            userId
          })
        });
        
        if (completeResponse.ok) {
          console.log(`[${subjectType}] Test session completed successfully`);
          
          // Notify parent component session is completed
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
          
          // IMPORTANT: Set current session ID to null to allow a new one to be created
          setCurrentSessionId(null);
          
          // Reset session initialization status
          sessionInitializationRef.current = false;
        } else {
          const errorText = await completeResponse.text();
          console.error(`[${subjectType}] Failed to complete test session:`, 
            completeResponse.status, errorText);
        }
      } catch (error) {
        console.error(`[${subjectType}] Error completing test session:`, error);
      }
    } else {
      console.warn(`[${subjectType}] No valid session ID to complete`);
    }
    
    // Ensure the summary stays visible no matter what happened above
    setTimeout(() => {
      setShowQuizSummary(true);
    }, 100);
  };
  
  // Function to handle closing the modal
  const handleClose = () => {
    // If summary is being shown, ask for confirmation
    if (isQuizCompleted && showQuizSummary) {
      const confirmClose = window.confirm('Are you sure you want to close the summary? You won\'t be able to see these results again.');
      if (!confirmClose) {
        return; // Don't close if user cancels
      }
    }
    
    // Complete the session if we need to before closing
    if (currentSessionId) {
      try {
        console.log(`[${subjectType}] Completing session on modal close:`, currentSessionId);
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
            console.log(`[${subjectType}] Session completed on close`);
          } else {
            console.warn(`[${subjectType}] Failed to complete session on close`);
          }
          
          // Reset session state
          setCurrentSessionId(null);
          sessionInitializationRef.current = false;
          
          // Notify parent
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
        });
      } catch (error) {
        console.error(`[${subjectType}] Error completing session on close:`, error);
      }
    }
    
    onClose();
  };
  
  const defaultRenderFormula = (formula: string) => {
    try {
      // Use QuizMathRenderer component for consistent rendering
      return <QuizMathRenderer content={formula} />;
    } catch (error) {
      console.error('Error rendering formula:', error);
      return <div className="math-formula-error">Error rendering formula</div>;
    }
  };

  // Helper function to render option text
  const renderOptionText = (text: string | Option | null | undefined) => {
    if (text === null || text === undefined) {
      return '';
    }
    
    // Get the text value
    let textValue: string;
    
    // If text is already a string, use it directly
    if (typeof text === 'string') {
      textValue = text;
    } 
    // If text is an object with a text property
    else if (typeof text === 'object' && 'text' in text) {
      textValue = String(text.text);
    } 
    // Fallback - convert to string
    else {
      textValue = String(text);
    }
    
    // Apply any formatOptionText function if provided
    textValue = formatOptionText ? formatOptionText(textValue) : textValue;
    
    // Pre-process the text to fix any LaTeX issues, especially with \text commands
    if (textValue.includes('\\text')) {
      try {
        // Use the enhanced processMathExpression function to fix LaTeX issues
        const processedText = processMathExpression(textValue);
        
        // If the function added delimiters but the content already had them,
        // we need to remove the extra ones
        if (
          (processedText.startsWith('\\(') && textValue.startsWith('$')) ||
          (processedText.startsWith('\\[') && textValue.startsWith('$$'))
        ) {
          // Extract the content without the added delimiters
          textValue = processedText.slice(2, -2);
        } else if (!textValue.startsWith('$') && !textValue.startsWith('\\(') && !textValue.startsWith('\\[')) {
          // If the original text didn't have delimiters but processMathExpression added them
          textValue = processedText;
        } else {
          // Otherwise, use the processed text directly
          textValue = processedText;
        }
      } catch (error) {
        console.error('Error pre-processing LaTeX in modal:', error);
      }
    }
    
    // Use the specialized QuizMathRenderer
    return <QuizMathRenderer content={textValue} />;
  }

  if (!isOpen) {
    return null;
  }

  // Show initialization error if there is one
  if (initError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6">
          <h2 className="text-xl font-semibold mb-4">Session Initialization Error</h2>
          <div className="bg-red-50 p-4 rounded-lg mb-4 text-red-700">
            <p className="font-medium">Failed to start quiz session</p>
            <p className="text-sm mt-1">{initError}</p>
            <p className="text-sm mt-2">Check your network connection and try again.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state if we don't have a current question yet
  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  // Render the quiz modal
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {subtopicName} - Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        {/* Quiz content */}
        {!isQuizCompleted ? (
          <div className="p-6">
            {/* Timer and status display - added from old UI */}
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

            {/* Session ID display */}
            <div className="mb-4 text-xs text-gray-500">
              Session ID: {currentSessionId || 'Not set yet'} | 
              Answered: {results.totalCount} |
              Time spent: {timeSpentOnQuestion}s
            </div>
            
            {/* Question */}
            <div className="mb-6">
              <p className="text-lg">
                <QuizMathRenderer content={currentQuestion.question} />
              </p>
              {currentQuestion.formula && (
                <div className="formula-container">
                  {renderFormula ? 
                    renderFormula(currentQuestion.formula) :
                    defaultRenderFormula(currentQuestion.formula)
                  }
                </div>
              )}
            </div>
            
            {/* Options */}
            <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
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
                  {/* Use JSX to allow the MathRenderer to be properly rendered */}
                  {renderOptionText(option.text)}
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
                  <QuizMathRenderer content={currentQuestion.explanation} />
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
                    disabled={!selectedOption}
                    className={`px-4 py-2 rounded ${
                      selectedOption
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Check Answer
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
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${results.questions.length > 6 ? 'sticky top-0 bg-white pt-2 pb-2 z-10' : ''}`}>Quiz Summary</h3>
                
                {/* Results stats */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${results.questions.length > 6 ? 'sticky top-14 bg-white z-10 pb-2' : ''}`}>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-blue-700">Total Questions</div>
                    <div className="text-2xl font-bold text-blue-800">{questions.length}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-green-700">Correct Answers</div>
                    <div className="text-2xl font-bold text-green-800">{results.correctCount}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-purple-700">Score</div>
                    <div className="text-2xl font-bold text-purple-800">
                      {Math.round((results.correctCount / questions.length) * 100)}%
                    </div>
                  </div>
                </div>
                
                {/* Question list */}
                <div className={`${results.questions.length > 6 ? 'max-h-[40vh] overflow-y-auto' : ''} pr-2 mb-6`}>
                  <div className="space-y-4">
                    {results.questions.map((question, index) => {
                      const isCorrect = question.correctAnswer === question.userAnswer;
                      
                      return (
                        <div 
                          key={index}
                          className={`p-3 border rounded ${
                            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="font-medium mb-1">Question {index + 1}:</div>
                          <div className="mb-1">
                            <QuizMathRenderer content={question.question} />
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Your answer:</span>{' '}
                            {renderOptionText(question.userAnswer)}
                          </div>
                          {!isCorrect && (
                            <div className="text-sm text-green-700">
                              <span className="font-medium">Correct answer:</span>{' '}
                              {renderOptionText(question.correctAnswer)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className={`flex justify-between mt-4 ${results.questions.length > 6 ? 'sticky bottom-0 bg-white pb-2 pt-2' : 'pb-2 pt-2'}`}>
                  <button
                    onClick={() => setShowQuizSummary(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default EnhancedQuizModalOld;
