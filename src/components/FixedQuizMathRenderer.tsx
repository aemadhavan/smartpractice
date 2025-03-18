'use client';
import React from 'react';
import { QuizMathContent } from './math/QuizMathContent';

interface FixedQuizMathRendererProps {
  content: string | null | undefined;
  className?: string;
}

/**
 * FixedQuizMathRenderer - A drop-in replacement for the original renderer
 * Uses the unified QuizMathContent component internally
 */
const FixedQuizMathRenderer: React.FC<FixedQuizMathRendererProps> = ({ 
  content,
  className = "quiz-math-content"
}) => {
  return <QuizMathContent content={content} className={className} />;
};

export default FixedQuizMathRenderer;