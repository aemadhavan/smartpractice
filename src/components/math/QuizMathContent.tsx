//File : /src/components/math/QuizMathContent.tsx
'use client';

import React from 'react';
import { mightContainLatex } from '../../lib/mathUtils';
import { MathJax } from 'better-react-mathjax';

interface QuizMathContentProps {
  /**
   * The content to render - may contain LaTeX expressions
   */
  content: string | null | undefined;
  
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Specialized component for rendering quiz content that may contain LaTeX
 * Handles null/undefined content gracefully
 */
export const QuizMathContent: React.FC<QuizMathContentProps> = ({
  content,
  className = "quiz-math-content"
}) => {
  // Handle empty content gracefully
  if (!content || content.trim() === '') {
    return <span className={className}></span>;
  }
  
    if (!mightContainLatex(content)) {
        return <span className={className}>{content}</span>;
    }
  
  // For content that doesn't appear to have LaTeX, just render it directly
  if (!mightContainLatex(content)) {
    return <span className={className}>{content}</span>;
  }
  
  // Otherwise use MathJax to render it
  return (
    <MathJax className={className} hideUntilTypeset="first">
      {content}
    </MathJax>
  );
};