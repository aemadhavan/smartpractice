// File: /src/components/QuizPage.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Remove unused Link import
import { Option, formatOptionText } from '@/lib/options';
// Import the fixed version instead of the original
import FixedQuizMathRenderer from './FixedQuizMathRenderer';
// Remove unused imports
import ImprovedLatexRenderer from './ImprovedLatexRenderer';
import sessionManager from '@/lib/session-manager';
import { MathJax } from 'better-react-mathjax';
import MathFormula from './MathFormula';
import OptionText from './OptionText';
// Import the MathJax type from your types file
import type { MathJax as MathJaxType } from '@/types/mathjax';

// Define the QuizQuestion type
export type QuizQuestion = {
  id: number;
  question: string;
  options: Option[]; // Array of { id: string; text: string }
  correctAnswer: string; // Text value (e.g., "15", not "o3")
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
  calculateNewStatus?: (question: QuizQuestion, isCorrect: boolean, successRate: number) => 'Mastered' | 'Learning' | 'To Start';
  subjectType: 'maths' | 'quantitative';
};

// Define a proper interface for the Window with MathJax
interface WindowWithMathJax {
  mathJaxReady?: boolean;
  safeTypesetMathJax?: () => void;
  MathJax?: MathJaxType;
}

const QuizPage: React.FC<QuizPageProps> = ({
  subtopicName,
  questions,
  userId,
  topicId,
  onQuestionsUpdate,
  onSessionIdUpdate,
  testSessionId,
  apiEndpoints,
  // renderFormula, // Commented out since it's unused
  calculateNewStatus,
  subjectType
}) => {
  const router = useRouter();
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
  const [optionsReady, setOptionsReady] = useState(false);
  
  // Add a ref for the options container (not used but kept to avoid refactoring dependencies)
 // const optionsContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize session when component mounts
  useEffect(() => {
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
    
    const initSession = async () => {
      try {
        // Use the session manager to handle initialization
        const sessionId = await sessionManager.initSession(
          userId,
          questions[0].subtopicId,
          apiEndpoints.initSession
        );
        
        if (sessionId) {
          // Update state with new session ID
          setCurrentSessionId(sessionId);
          
          // Notify parent component of session ID
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
    
    // Initialize the session
    initSession();
  }, [questions, userId, apiEndpoints.initSession, currentSessionId, subjectType, onSessionIdUpdate]);
  
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
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeAllocation);
      setQuestionStartTime(Date.now());
      setIsPaused(false);
      
      // Ensure MathJax is typeset when a new question is loaded
      if (typeof window !== 'undefined') {
        // Wait for MathJax to be fully loaded and ready
        const waitForMathJax = () => {
          const win = window as unknown as WindowWithMathJax;
          
          if (win.mathJaxReady && win.safeTypesetMathJax) {
            // Use the global safe typesetting function
            win.safeTypesetMathJax();
          } else if (win.MathJax && win.MathJax.typesetPromise) {
            // Fall back to direct MathJax typesetting
            try {
              // Use an empty array to let MathJax process all elements
              win.MathJax.typesetPromise([document.body])
                .catch((err: Error) => {
                  console.error('MathJax typesetting failed:', err);
                });
            } catch (error) {
              console.error('Error processing MathJax:', error);
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
  }, [currentQuestion, currentQuestionIndex]);

  // More robust MathJax and options rendering approach
  // More robust MathJax and options rendering approach
  useEffect(() => {
    if (currentQuestion) {
      // First set options to loading state, but don't hide them completely
      setOptionsReady(false);
      
      // Schedule MathJax processing with a smoother reveal
      const attempts = [100, 300, 500];
      
      attempts.forEach((delay, index) => {
        setTimeout(() => {
          const win = window as unknown as WindowWithMathJax;
          
          if (typeof window !== 'undefined' && win.MathJax) {
            try {
              // Process MathJax
              if (win.MathJax.typesetPromise) {
                win.MathJax.typesetPromise([document.body])
                  .then(() => {
                    if (index === attempts.length - 1 || !optionsReady) {
                      // Use a slight delay for the reveal to ensure rendering is complete
                      setTimeout(() => setOptionsReady(true), 50);
                    }
                  })
                  .catch(() => {
                    if (index === attempts.length - 1) {
                      setTimeout(() => setOptionsReady(true), 50);
                    }
                  });
              } else {
                if (index === attempts.length - 1) {
                  setTimeout(() => setOptionsReady(true), 50);
                }
              }
            } catch (error) {
              console.error(`[${subjectType}] Error processing MathJax:`, error);
              if (index === attempts.length - 1) {
                setTimeout(() => setOptionsReady(true), 50);
              }
            }
          } else if (index === attempts.length - 1) {
            setTimeout(() => setOptionsReady(true), 50);
          }
        }, delay);
      });
      
      // Safety fallback, slightly reduced since we're showing skeletons anyway
      const fallbackTimer = setTimeout(() => {
        if (!optionsReady) {
          setOptionsReady(true);
        }
      }, 1500);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [currentQuestion, optionsReady, subjectType]);
  
  // Timer effect
  useEffect(() => {
    if (isPaused || isAnswerSubmitted || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPaused, isAnswerSubmitted, timeLeft]);
  
  // Debug logging for options
  useEffect(() => {
    if (currentQuestion) {
      console.log(`[${subjectType}] Current question:`, currentQuestion);
      console.log(`[${subjectType}] Options:`, currentQuestion.options.map(o => ({
        id: o.id,
        text: o.text,
        idType: typeof o.id,
        textType: typeof o.text
      })));
    }
  }, [currentQuestion, subjectType]);
  
  // Function to check the answer
  const checkAnswer = useCallback(async () => {
    if (!selectedOption || isAnswerSubmitted || !currentQuestion) return;
    
    // Get the correct answer and selected option values
    const correctAnswerValue = currentQuestion.correctAnswer;
    const selectedOptionValue = currentQuestion.options.find(opt => opt.id === selectedOption)?.text || '';
    
    // Check if the answer is correct by comparing text values
    const isCorrect = correctAnswerValue === selectedOptionValue;
    
    // Set the answer submission state
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
          // Store the user's answer for later review
          userAnswer: selectedOptionValue
        }
      ]
    }));
    
    
    // Calculate time spent
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Submit the answer to the API only if we have a session ID
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
      const waitForMathJax = () => {
        const win = window as unknown as WindowWithMathJax;
        
        if (win.mathJaxReady && win.safeTypesetMathJax) {
          win.safeTypesetMathJax();
        } else if (win.MathJax && win.MathJax.typesetPromise) {
          try {
            win.MathJax.typesetPromise([document.body])
              .catch((err: Error) => {
                console.error('MathJax typesetting failed after question change:', err);
              });
          } catch (error) {
            console.error('Error processing MathJax after question change:', error);
          }
        } else {
          setTimeout(waitForMathJax, 100);
        }
      };
      
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
    
    // Complete the session using the session manager
    if (currentSessionId) {
      try {
        const completed = await sessionManager.completeSession(userId, apiEndpoints.completeSession);
        
        if (completed) {
          // Notify parent component session is completed
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
          
          // Set current session ID to null to allow a new one to be created
          setCurrentSessionId(null);
          
          // Reset session initialization status
          sessionInitializationRef.current = false;
        }
      } catch (error) {
        console.error(`[${subjectType}] Error completing test session:`, error);
      }
    }
    
    // Ensure the summary stays visible
    setTimeout(() => {
      setShowQuizSummary(true);
    }, 100);
  };
  
  // Function to go back to topics page
  const goBackToTopics = () => {
    // Complete the session if needed before navigating
    if (currentSessionId) {
      try {
        console.log(`[${subjectType}] Completing session before navigation:`, currentSessionId);
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
          
          // Reset session state
          setCurrentSessionId(null);
          sessionInitializationRef.current = false;
          
          // Notify parent
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
          
          // Navigate back
          router.push(`/maths/topics/${topicId}`);
        });
      } catch (error) {
        console.error(`[${subjectType}] Error completing session on navigation:`, error);
        // Navigate back anyway
        router.push(`/maths/topics/${topicId}`);
      }
    } else {
      // No session to complete, just navigate
      router.push(`/maths/topics/${topicId}`);
    }
  };
  
 // Helper function to render option text
 const renderOptionText = (text: string | Option | null | undefined) => {
    // Get the text value
    let textValue: string;
    
    // If text is already a string, use it directly
    if (typeof text === 'string') {
      textValue = text;
    } 
    // If text is an object with a text property
    else if (typeof text === 'object' && text && 'text' in text) {
      textValue = String((text as Option).text);
    } 
    // Fallback - convert to string or use empty string
    else {
      textValue = text ? String(text) : '';
    }
    
    // Apply any formatOptionText function if provided
    textValue = formatOptionText ? formatOptionText(textValue) : textValue;
    
    // CURRENCY DETECTION - Special case for currency values
    // This pattern matches dollar amounts like $1.61, $2.71, etc.
    if (/^\$\d+(\.\d+)?$/.test(textValue)) {
      console.log(`[${subjectType}] Rendering currency: ${textValue}`);
      return <span className="currency-value">{textValue}</span>;
    }
    
    // LATEX CONTENT - Check for actual LaTeX notation
    if (textValue.includes('\\') || 
        (textValue.includes('$') && textValue.indexOf('$') !== 0) || 
        (textValue.match(/\$/g) || []).length > 1) {
      console.log(`[${subjectType}] Rendering LaTeX: ${textValue}`);
      return <ImprovedLatexRenderer formula={textValue} />;
    }
    
    // PLAIN TEXT - For all other content
    console.log(`[${subjectType}] Rendering plain text: ${textValue}`);
    return <FixedQuizMathRenderer content={textValue} />;
  };
  

  // Show initialization error if there is one
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
  
  // Show loading state if we don't have a current question yet
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

            {/* Session ID display */}
            <div className="mb-4 text-xs text-gray-500">
              Session ID: {currentSessionId || 'Not set yet'} | 
              Answered: {results.totalCount} |
              Time spent: {timeSpentOnQuestion}s
            </div>
            
            {/* Question */}
            <div className="mb-6 question-container">
              <p className="text-lg">
                <FixedQuizMathRenderer content={currentQuestion.question} />
              </p>
              {currentQuestion.formula && (
                <div className="formula-container" id="formula-container">
                  <MathFormula formula={currentQuestion.formula} />
                </div>
              )}
            </div>
            
            {/* Options - always render them, but control visibility with CSS */}
            <div className="space-y-3 mb-6 options-container" 
            style={{ 
                opacity: optionsReady ? 1 : 0.6,
                pointerEvents: optionsReady ? 'auto' : 'none'
            }}
            >
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
                {optionsReady ? (
                    <OptionText>{option.text}</OptionText>
                ) : (
                    <div className="skeleton-option h-6 bg-gray-100 rounded animate-pulse w-3/4"></div>
                )}
                </div>
            ))}
            </div>
            
            {/* Options loading indicator */}
            {!optionsReady && (
              <div className="space-y-3 mb-6">
                <div className="p-3 border rounded text-center">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mr-2"></div>
                  <span className="text-gray-500">Loading options...</span>
                </div>
              </div>
            )}
            
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
                    disabled={!selectedOption || !optionsReady}
                    className={`px-4 py-2 rounded ${
                      selectedOption && optionsReady
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
                            <FixedQuizMathRenderer content={question.question} />
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
                    onClick={goBackToTopics}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Back to Topics
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

export default QuizPage;