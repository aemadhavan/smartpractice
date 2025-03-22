// src/components/quiz/QuizActions.tsx
import React from 'react';

interface QuizActionsProps {
  isAnswerSubmitted: boolean;
  selectedOption: string | null;
  loading: boolean;
  correctCount: number;
  answeredCount: number;
  isLastQuestion: boolean;
  onCheckAnswer: () => void;
  onNextQuestion: () => void;
}

const QuizActions: React.FC<QuizActionsProps> = ({
  isAnswerSubmitted,
  selectedOption,
  loading,
  correctCount,
  answeredCount,
  isLastQuestion,
  onCheckAnswer,
  onNextQuestion
}) => {
  return (
    <div className="flex justify-between">
      <div>
        {/* Current progress */}
        <div className="text-sm text-gray-500">
          {correctCount} correct of {answeredCount} answered
        </div>
      </div>
      
      <div className="space-x-3">
        {!isAnswerSubmitted ? (
          <button
            onClick={onCheckAnswer}
            disabled={!selectedOption || loading}
            className={`px-4 py-2 rounded ${
              selectedOption && !loading
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Loading...' : 'Check Answer'}
          </button>
        ) : (
          <button
            onClick={onNextQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {isLastQuestion ? 'Complete Quiz' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizActions;