//File : /src/components/math/MathFormula.tsx
'use client';

import React from 'react';
import { MathJax } from 'better-react-mathjax';

interface MathFormulaProps {
  /**
   * The formula to render - handles null/undefined gracefully
   */
  formula: string | null | undefined;
  
  /**
   * Whether to display the formula inline or as a block
   */
  inline?: boolean;
  
  /**
   * Additional CSS class
   */
  className?: string;
  
  /**
   * Whether to hide content until typeset
   */
  hideUntilTypeset?: "first" | "every";
  
  /**
   * Custom style props
   */
  style?: React.CSSProperties;
}

/**
 * Unified MathFormula component for rendering LaTeX formulas
 * Handles null/undefined formulas gracefully
 */
export const MathFormula: React.FC<MathFormulaProps> = ({
  formula,
  inline = false,
  className = "math-formula",
  hideUntilTypeset = "first",
  style
}) => {
  // Return placeholder div if no formula to prevent errors
  if (!formula || formula.trim() === '') {
    return <div className={className} style={style}></div>;
  }
  
  // Process formula to ensure proper LaTeX
  const processFormula = (input: string): string => {
    // Check if formula already has delimiters
    const hasDelimiters = 
      (input.startsWith('$') && input.endsWith('$')) ||
      (input.startsWith('$$') && input.endsWith('$$')) ||
      (input.startsWith('\\(') && input.endsWith('\\)')) ||
      (input.startsWith('\\[') && input.endsWith('\\]'));
    
    // If already has delimiters, return as is
    if (hasDelimiters) {
      return input;
    }
    
    // Add appropriate delimiters based on display mode
    return inline ? `$${input}$` : `$$${input}$$`;
  };
  
  const processedFormula = processFormula(formula);
  
  return (
    <MathJax
      inline={inline}
      hideUntilTypeset={hideUntilTypeset}
      className={className}
      style={style}
    >
      {processedFormula}
    </MathJax>
  );
};