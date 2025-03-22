// src/components/quiz/QuizHeader.tsx
import React from 'react';

interface QuizHeaderProps {
  subtopicName: string;
  currentIndex: number;
  totalQuestions: number;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({ 
  subtopicName, 
  currentIndex, 
  totalQuestions 
}) => {
  return (
    <h2 className="text-xl font-semibold mb-4">
      {subtopicName} - Question {currentIndex + 1} of {totalQuestions}
    </h2>
  );
};

export default QuizHeader;