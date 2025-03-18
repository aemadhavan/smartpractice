//File: /src/components/math/OptionText.tsx
'use client';

import React from 'react';
import { mightContainLatex } from '@/lib/mathUtils';
import { MathJax } from 'better-react-mathjax';
import { Option } from '@/lib/options';

interface OptionTextProps {
  children: string | Option | null | undefined;
  className?: string;
}

/**
 * Optimized component for rendering option text in quizzes
 * Handles both plain text and LaTeX content
 */
const OptionText: React.FC<OptionTextProps> = ({
  children,
  className = "option-text"
}) => {
  // Extract text content from various input types
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
  
  // Handle currency values specially
  if (/^\$\d+(\.\d+)?$/.test(textContent)) {
    return <span className={`${className} currency-value`}>{textContent}</span>;
  }
  
  // For content without LaTeX, render directly
  if (!mightContainLatex(textContent)) {
    return <span className={className}>{textContent}</span>;
  }
  
  // For content with LaTeX, use MathJax
  return (
    <MathJax hideUntilTypeset="first" className={className}>
      {textContent}
    </MathJax>
  );
};

export default React.memo(OptionText);