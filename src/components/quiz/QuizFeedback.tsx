// src/components/quiz/QuizFeedback.tsx
import React from 'react';

interface QuizFeedbackProps {
  isCorrect: boolean;
  explanation: string;
  renderer: (content: string) => React.ReactNode;
  adaptiveRecommendations: React.ReactNode;
}

const QuizFeedback: React.FC<QuizFeedbackProps> = ({
  isCorrect,
  explanation,
  renderer,
  adaptiveRecommendations
}) => {
  return (
    <>
      <div className={`p-4 mb-6 rounded ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="font-medium mb-2">
          {isCorrect ? 'Correct!' : 'Incorrect!'}
        </div>
        <div>
          {renderer(explanation)}
        </div>
      </div>
      {adaptiveRecommendations}
    </>
  );
};

export default QuizFeedback;