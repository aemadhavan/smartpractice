// src/components/quiz/QuizProgress.tsx
import React from 'react';

interface QuizProgressProps {
  currentIndex: number;
  totalQuestions: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({ 
  currentIndex, 
  totalQuestions 
}) => {
  const progressPercentage = (currentIndex / totalQuestions) * 100;
  
  return (
    <div className="w-full bg-gray-200 h-2 mb-4 rounded-full overflow-hidden">
      <div 
        className="bg-blue-600 h-full transition-all duration-300 ease-out" 
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
};

export default QuizProgress;