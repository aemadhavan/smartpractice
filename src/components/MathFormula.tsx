// File: /src/components/MathFormula.tsx
import React from 'react';
import { MathJax } from 'better-react-mathjax';

interface MathFormulaProps {
  /**
   * The formula to render
   */
  formula: string | null | undefined;
  
  /**
   * Whether to display the formula inline
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
   * Whether to dynamically update on changes
   */
  dynamic?: boolean;
  
  /**
   * Custom style props
   */
  style?: React.CSSProperties;
}

/**
 * MathFormula component - Renders LaTeX formulas with proper typesetting
 * 
 * This component is designed to replace ImprovedLatexRenderer and EnhancedFormulaRenderer
 * while providing better support for all LaTeX constructs, including trigonometric functions.
 */
const MathFormula: React.FC<MathFormulaProps> = ({
  formula,
  inline = false,
  className = "math-formula",
  hideUntilTypeset = "first",
  dynamic = true,
  style
}) => {
  // Return empty component if no formula
  if (!formula) {
    return <div className={className} style={style}></div>;
  }
  
  // Process formula to ensure proper LaTeX
  const processFormula = (input: string): string => {
    // Check if the formula already has delimiters
    const hasDelimiters = (
      input.startsWith('$') && input.endsWith('$') ||
      input.startsWith('$$') && input.endsWith('$$') ||
      input.startsWith('\\(') && input.endsWith('\\)') ||
      input.startsWith('\\[') && input.endsWith('\\]')
    );
    
    // If already has delimiters, return as is
    if (hasDelimiters) {
      return input;
    }
    
    // Add proper delimiters based on display mode
    return inline ? `$${input}$` : `$$${input}$$`;
  };
  
  const processedFormula = processFormula(formula);
  
  return (
    <MathJax
      inline={inline}
      hideUntilTypeset={hideUntilTypeset}
      dynamic={dynamic}
      className={className}
      style={style}
    >
      {processedFormula}
    </MathJax>
  );
};

export default MathFormula;