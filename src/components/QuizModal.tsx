// File: /src/components/QuizModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Option, 
  formatOptionText
} from '@/lib/options';

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

type QuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subtopicName: string;
  questions: QuizQuestion[];
  userId: string;
  topicId: number;
  onQuestionsUpdate?: (questions: QuizQuestion[]) => void;
  onSessionIdUpdate?: (sessionId: number | null) => void;
  testSessionId?: number | null;
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
  testSessionId
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
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(testSessionId || null);
  
  // Add timer-related state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  
  // Debug state to track time spent calculation
  const [timeSpentOnQuestion, setTimeSpentOnQuestion] = useState<number>(0);
  
  // Reset the state when the modal is opened with new questions
  useEffect(() => {
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
      
      // Set the current session ID if it was passed in
      if (testSessionId) {
        setCurrentSessionId(testSessionId);
      }
    } else {
      // This prevents the summary from disappearing when modal props change
      // Only reset if modal is actually closing
      if (isQuizCompleted && showQuizSummary) {
        console.log('Preserving quiz summary state even though modal props changed');
        // Don't reset the state here
      }
    }
  }, [isOpen, testSessionId]);
  
  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Initialize timer when question changes
  useEffect(() => {
    if (currentQuestion && isOpen) {
      setTimeLeft(currentQuestion.timeAllocation);
      setQuestionStartTime(Date.now());
      setIsPaused(false);
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
  
  // Debug logging for options
  useEffect(() => {
    if (currentQuestion) {
      console.log('Current question:', currentQuestion);
      console.log('Options:', currentQuestion.options.map(o => ({
        id: o.id,
        text: o.text,
        idType: typeof o.id,
        textType: typeof o.text
      })));
    }
  }, [currentQuestion]);
  
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
    
    // Submit the answer to the API
    try {
      let sessionId = currentSessionId;
      
      // If we don't have a session ID, initialize a new one
      if (!sessionId) {
        const initResponse = await fetch('/api/quantitative/init-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            subtopicId: currentQuestion.subtopicId
          })
        });
        
        if (initResponse.ok) {
          const initResult = await initResponse.json();
          sessionId = initResult.testAttemptId;
          setCurrentSessionId(sessionId);
          
          // Notify parent component of session ID
          if (onSessionIdUpdate) {
            onSessionIdUpdate(sessionId);
          }
        } else {
          console.error('Failed to initialize test session');
        }
      }
      
      // Only proceed if we have a valid session ID
      if (sessionId) {
        // Use track-attempt instead of submit-answer
        const apiResponse = await fetch('/api/quantitative/track-attempt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testSessionId: sessionId,
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
          console.error('Failed to submit answer');
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  }, [
    selectedOption, 
    isAnswerSubmitted, 
    currentQuestion, 
    questionStartTime, 
    currentSessionId, 
    userId, 
    topicId, 
    onSessionIdUpdate
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
      return;
    }
    
    // Otherwise, move to the next question
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsAnswerCorrect(false);
  };
  
  // Function to complete the quiz
  const completeQuiz = async () => {
    // Show the quiz summary immediately and ensure it stays visible
    setShowQuizSummary(true);
    
    // Prepare the updated questions with mastery status
    const updatedQuestions = questions.map((question, index) => {
      // Only update if in results
      if (index < results.questions.length) {
        const resultQuestion = results.questions[index];
        const isCorrect = resultQuestion.correctAnswer === resultQuestion.userAnswer;
        
        // Calculate new status based on current status and answer correctness
        let newStatus = question.status;
        
        if (isCorrect) {
          // If correct, move up in mastery
          if (question.status === 'To Start') {
            newStatus = 'Learning';
          } else if (question.status === 'Learning' && question.successRate >= 70) {
            newStatus = 'Mastered';
          }
        } else {
          // If incorrect, move down in mastery or stay the same
          if (question.status === 'Mastered') {
            newStatus = 'Learning';
          }
        }
        
        // Calculate new success rate
        const totalAttempts = question.attemptCount + 1;
        const oldSuccessCount = Math.round(question.successRate * question.attemptCount / 100);
        const newSuccessCount = oldSuccessCount + (isCorrect ? 1 : 0);
        const newSuccessRate = totalAttempts > 0 
          ? (newSuccessCount / totalAttempts) * 100 
          : 0;
        
        return {
          ...question,
          status: newStatus,
          attemptCount: totalAttempts,
          successRate: newSuccessRate
        };
      }
      
      return question;
    });
    
    // Update parent component with new questions
    if (onQuestionsUpdate) {
      onQuestionsUpdate(updatedQuestions);
    }
    
    // Use a try/catch to make API calls more resilient - don't let failures affect UI
    if (currentSessionId) {
      try {
        const completeResponse = await fetch('/api/quantitative/complete-session', {
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
          console.log('Test session completed successfully');
          
          // Notify parent component that session is completed
          if (onSessionIdUpdate) {
            onSessionIdUpdate(null);
          }
          
          setCurrentSessionId(null);
        } else {
          console.error('Failed to complete test session');
        }
      } catch (error) {
        console.error('Error completing test session:', error);
        // Failures shouldn't affect the UI state
      }
    }
    
    // Ensure summary stays visible after all async operations
    setShowQuizSummary(true);
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
    
    onClose();
  };
  
  if (!isOpen || !currentQuestion) {
    return null;
  }

  // Helper function to render option text (since we're missing the imported one)
  const renderOptionText = (text: string | Option | null | undefined) => {
    if (text === null || text === undefined) {
      return '';
    }
    
    // If text is already a string, use it directly
    if (typeof text === 'string') {
      return formatOptionText ? formatOptionText(text) : text;
    }
    
    // If text is an object with a text property
    if (typeof text === 'object' && 'text' in text) {
      const textValue = String(text.text);
      return formatOptionText ? formatOptionText(textValue) : textValue;
    }
    
    // Fallback - convert to string
    const textValue = String(text);
    return formatOptionText ? formatOptionText(textValue) : textValue;
  };

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
              <p className="text-lg">{currentQuestion.question}</p>
              {currentQuestion.formula && (
                <p className="mt-2 bg-gray-50 p-2 font-mono">{currentQuestion.formula}</p>
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
                  {currentQuestion.explanation}
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
                          <div className="mb-1">{question.question}</div>
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

export default QuizModal;