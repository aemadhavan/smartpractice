// File: /src/components/QuizModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Option, 
  extractOptionValue, 
  renderOptionText, 
  prepareOptionsForStorage,
  normalizeOptionsFromDB
} from '@/lib/options';

// Define the QuizQuestion type to match the ProcessedQuestion type in page.tsx
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
  attemptCount: number;
  successRate: number;
  status: 'Mastered' | 'Learning' | 'To Start';
  subtopicId: number;
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
    questions: QuizQuestion[];
  }>({
    correctCount: 0,
    totalCount: 0,
    questions: []
  });
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showQuizSummary, setShowQuizSummary] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(testSessionId || null);
  
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
    }
  }, [isOpen, testSessionId]);
  
  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Function to handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionId);
    }
  };
  
  // Function to check the answer
  const checkAnswer = async () => {
    if (!selectedOption || isAnswerSubmitted) return;
    
    // Get the correct option and selected option values (without prefix)
    const correctOptionValue = extractOptionValue(currentQuestion.correctOption);
    const selectedOptionValue = extractOptionValue(selectedOption);
    
    // Check if the answer is correct
    const isCorrect = correctOptionValue === selectedOptionValue;
    
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
          userAnswer: selectedOption
        } as any
      ]
    }));
    
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
        // Prepare the answer for submission - ensure options are in JSON format
        const apiResponse = await fetch('/api/quantitative/submit-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testSessionId: sessionId,
            userId,
            questionId: currentQuestion.id,
            selectedOption: selectedOptionValue,
            isCorrect,
            timeSpent: 30 // Default time spent for now
          })
        });
        
        if (!apiResponse.ok) {
          console.error('Failed to submit answer');
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
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
    // Show the quiz summary
    setShowQuizSummary(true);
    
    // Prepare the updated questions with mastery status
    const updatedQuestions = questions.map((question, index) => {
      // Only update if in results
      if (index < results.questions.length) {
        const resultQuestion = results.questions[index] as any;
        const isCorrect = extractOptionValue(resultQuestion.userAnswer) === 
                          extractOptionValue(question.correctOption);
        
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
    
    // Complete the session if we have a session ID
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
      }
    }
  };
  
  // Function to handle closing the modal
  const handleClose = () => {
    onClose();
  };
  
  if (!isOpen || !currentQuestion) {
    return null;
  }

  // Render the quiz modal
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-90vh overflow-auto">
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
                    isAnswerSubmitted && extractOptionValue(option.id) === extractOptionValue(currentQuestion.correctOption)
                      ? 'bg-green-50 border-green-500'
                      : ''
                  } ${
                    isAnswerSubmitted && 
                    selectedOption === option.id && 
                    extractOptionValue(option.id) !== extractOptionValue(currentQuestion.correctOption)
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
                <h3 className="text-xl font-semibold mb-4">Quiz Summary</h3>
                
                {/* Results stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <div className="space-y-4 mb-6">
                  {results.questions.map((question: any, index) => {
                    const isCorrect = extractOptionValue(question.userAnswer) === 
                                     extractOptionValue(question.correctOption);
                    
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
                          {renderOptionText(extractOptionValue(question.userAnswer))}
                        </div>
                        {!isCorrect && (
                          <div className="text-sm text-green-700">
                            <span className="font-medium">Correct answer:</span>{' '}
                            {renderOptionText(extractOptionValue(question.correctOption))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
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