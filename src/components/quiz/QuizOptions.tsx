// src/components/quiz/QuizOptions.tsx
import React from 'react';
import { Option } from '@/types/quiz';

interface QuizOptionsProps {
  options: Option[];
  selectedOption: string | null;
  isAnswerSubmitted: boolean;
  correctAnswer: string;
  onOptionSelect: (optionId: string) => void;
  loading: boolean;
  renderer?: (text: string | Option | null | undefined) => React.ReactNode;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
  options,
  selectedOption,
  isAnswerSubmitted,
  correctAnswer,
  onOptionSelect,
  loading,
  renderer
}) => {
  return (
    <div 
      className="space-y-3 mb-6 options-container" 
      style={{ 
        opacity: loading ? 0.6 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      {options.map((option, index) => (
        <div
          key={option.id}
          className={`p-3 border rounded cursor-pointer transition-colors ${
            loading ? 'pointer-events-none' : ''
          } ${
            selectedOption === option.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
          } ${
            isAnswerSubmitted && option.text === correctAnswer
              ? 'bg-green-50 border-green-500'
              : ''
          } ${
            isAnswerSubmitted && 
            selectedOption === option.id && 
            option.text !== correctAnswer
              ? 'bg-red-50 border-red-500'
              : ''
          }`}
          onClick={() => onOptionSelect(option.id)}
        >
          {loading ? (
            <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4"></div>
          ) : (
            <div className="flex items-center w-full">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-800 font-medium">
                {String.fromCharCode(65 + index)} {/* A, B, C, D */}
              </div>
              <div className="option-text-container flex-grow">
                {renderer 
                  ? renderer(option) 
                  : option.text}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuizOptions;