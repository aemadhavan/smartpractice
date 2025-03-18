//File: /src/components/MathRenderer.tsx - Component for rendering LaTeX formulas
'use client';
import React, { useEffect, useRef } from 'react';
import { processMathExpression } from '@/lib/mathjax-config';
import { containsLatex } from '@/hooks/useMathJax';

// Update interface to make formula optional
interface MathRendererProps {
  formula?: string;  // Make formula optional
  display?: boolean;
  className?: string;
}

/**
 * MathRenderer component for rendering LaTeX formulas
 * Uses the MathJax CDN loaded by MathJaxProvider
 */
const MathRenderer: React.FC<MathRendererProps> = ({ 
  formula = '', // Default empty string for undefined inputs
  display = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Skip processing for empty formulas
    if (!formula) {
      containerRef.current.innerHTML = '';
      return;
    }

    try {
      // Process the formula to fix any LaTeX issues
      let processedFormula = formula;
      
      // Only process if it actually contains LaTeX notation
      if (containsLatex(formula)) {
        try {
          // Use the processMathExpression function if available
          processedFormula = processMathExpression(formula);
        } catch (error) {
          console.error('Error processing math formula:', error);
          // Fall back to the original formula if processing fails
          processedFormula = formula;
        }
      
        // Check if formula already has delimiters
        const hasDelimiters = 
          (processedFormula.startsWith('$') && processedFormula.endsWith('$')) ||
          (processedFormula.startsWith('\\(') && processedFormula.endsWith('\\)')) ||
          (processedFormula.startsWith('\\[') && processedFormula.endsWith('\\]')) ||
          (processedFormula.startsWith('$$') && processedFormula.endsWith('$$'));
        
        // Add delimiters if needed
        if (!hasDelimiters) {
          if (display) {
            processedFormula = `\\[${processedFormula}\\]`;
          } else {
            processedFormula = `\\(${processedFormula}\\)`;
          }
        }
      }
      
      // Set the HTML content
      containerRef.current.innerHTML = processedFormula;
      
      // Typeset with MathJax
      const typeset = async () => {
        // Use global safeTypesetMathJax helper if available
        if (window.safeTypesetMathJax) {
          await window.safeTypesetMathJax([containerRef.current!]);
          return;
        }
        
        // Fallback to direct MathJax usage
        if (window.MathJax?.typesetPromise) {
          try {
            await window.MathJax.typesetPromise([containerRef.current!]);
          } catch (error) {
            console.error('MathJax typesetting failed:', error);
          }
        }
      };
      
      // Try typesetting with a small delay to ensure MathJax is ready
      setTimeout(() => {
        typeset();
      }, 50);
      
    } catch (error) {
      console.error('Error preparing formula for rendering:', error);
      
      // Fallback to plain text display
      if (containerRef.current) {
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, display]);

  return (
    <div 
      ref={containerRef} 
      className={`math-formula ${display ? 'block-math' : 'inline-math'} ${className}`}
    />
  );
};

export default MathRenderer;