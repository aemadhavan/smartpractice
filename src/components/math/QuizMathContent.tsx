//File : /src/components/math/QuizMathContent.tsx
'use client';

import React from 'react';
import { MathJax } from 'better-react-mathjax';

interface QuizMathContentProps {
  content: string | null | undefined;
  className?: string;
}

/**
 * Simplified component for rendering quiz content with potential LaTeX
 */
export const QuizMathContent: React.FC<QuizMathContentProps> = ({
  content,
  className = "quiz-math-content"
}) => {
  // Handle empty content gracefully
  if (!content || content.trim() === '') {
    return <span className={className}></span>;
  }
  
  // Simple check for math content
  const hasMathContent = 
    content.includes('$') || 
    (content.includes('\\') && 
     (content.includes('frac') || 
      content.includes('sqrt') || 
      content.includes('text')));
  
  // For plain text content
  if (!hasMathContent) {
    return <span className={className}>{content}</span>;
  }
  
  // For math content, use MathJax with minimal options
  return (
    <MathJax className={className}>
      {content}
    </MathJax>
  );
};

export default QuizMathContent;