//File : /src/components/math/OptionText.tsx
'use client';

import React from 'react';
import { QuizMathContent } from './QuizMathContent';
import { Option } from '@/lib/options';

interface OptionTextProps {
  children: string | Option | null | undefined;
  className?: string;
}

/**
 * Component to handle rendering option text in quizzes
 * Works with different formats of option data
 */
export const OptionText: React.FC<OptionTextProps> = ({
  children,
  className = "option-text"
}) => {
  // Handle different types of input
  let textContent: string;
  
  if (typeof children === 'string') {
    textContent = children;
  } 
  else if (children && typeof children === 'object' && 'text' in children) {
    textContent = String((children as Option).text);
  }
  else {
    textContent = children ? String(children) : '';
  }
  
  // Special handling for currency values
  if (/^\$\d+(\.\d+)?$/.test(textContent)) {
    return <span className={`${className} currency-value`}>{textContent}</span>;
  }
  
  // Use our QuizMathContent component to handle potential LaTeX content
  return <QuizMathContent content={textContent} className={className} />;
};