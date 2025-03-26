// src/components/quiz/QuizQuestion.tsx
import { MathJax } from 'better-react-mathjax';
import React from 'react';

interface QuizQuestionProps {
  question: string;
  //renderer: (content: string) => React.ReactNode;
  loading: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  //renderer,
  loading
}) => {
  if (loading) {
    return (
      <div className="mb-6 question-container">
        <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2"></div>
      </div>
    );
  }
  
  return (
    <div className="mb-6 question-container">
      <div className="text-lg">
        {/* {renderer(question)} */}
        <MathJax>{question}</MathJax>
      </div>
    </div>
  );
};

export default QuizQuestion;