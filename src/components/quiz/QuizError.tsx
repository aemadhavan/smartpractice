// src/components/quiz/QuizError.tsx
import React from 'react';

interface QuizErrorProps {
  errorMessage: string;
  onBackToTopics: () => void;
}

const QuizError: React.FC<QuizErrorProps> = ({
  errorMessage,
  onBackToTopics
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Session Initialization Error</h2>
        <div className="bg-red-50 p-4 rounded-lg mb-4 text-red-700">
          <p className="font-medium">Failed to start quiz session</p>
          <p className="text-sm mt-1">{errorMessage}</p>
          <p className="text-sm mt-2">Check your network connection and try again.</p>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onBackToTopics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Topics
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizError;