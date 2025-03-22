//File: /src/components/math/FixedQuizMathRenderer.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { MathJax } from 'better-react-mathjax';

interface FixedQuizMathRendererProps {
  content: string | null | undefined;
  className?: string;
}

/**
 * Ultra-simplified math renderer to prevent stack overflows
 */
const FixedQuizMathRenderer: React.FC<FixedQuizMathRendererProps> = ({ 
  content,
  className = "quiz-math-content"
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simple loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [content]);
  
  // Handle empty content
  if (!content || content.trim() === '') {
    return <span className={className}></span>;
  }

  // Loading placeholder using spans (not divs to avoid HTML nesting issues)
  if (isLoading) {
    return (
      <span className={`${className} inline-block opacity-60`}>
        <span className="inline-block h-4 bg-gray-100 rounded animate-pulse w-1/2"></span>
      </span>
    );
  }
  
  // Simple check for math content - much less aggressive than before
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

export default React.memo(FixedQuizMathRenderer);