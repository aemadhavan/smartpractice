// src/components/quiz/QuizLoading.tsx
import React from 'react';

const QuizLoading: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
        <p>Loading questions...</p>
      </div>
    </div>
  );
};

export default QuizLoading;