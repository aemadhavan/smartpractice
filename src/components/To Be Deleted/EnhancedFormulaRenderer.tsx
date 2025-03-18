// File: /src/components/EnhancedFormulaRenderer.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface EnhancedFormulaRendererProps {
  formula: string;
  className?: string;
}

const EnhancedFormulaRenderer: React.FC<EnhancedFormulaRendererProps> = ({
  formula,
  className = "math-formula",
}) => {
  const formulaRef = useRef<HTMLDivElement | null>(null);
  const [renderAttempts, setRenderAttempts] = useState(0);
  const maxRenderAttempts = 5;

  // Helper function to preprocess the formula for better LaTeX compatibility
  const preprocessFormula = (rawFormula: string): string => {
    if (!rawFormula.trim()) return '';

    let processedFormula = rawFormula;

    // Ensure proper LaTeX delimiters
    if (
      !processedFormula.startsWith('$') &&
      !processedFormula.startsWith('\\(') &&
      !processedFormula.startsWith('$$') &&
      !processedFormula.startsWith('\\[')
    ) {
      processedFormula = `$${processedFormula}$`;
    }

    // Fix common LaTeX issues

    // 1. Ensure proper spacing in text mode
    if (processedFormula.includes('\\text{')) {
      // Add proper spacing between text and math operations
      processedFormula = processedFormula.replace(/\\text\{([^}]+)\}\s*([+\-*/×=])/g, '\\text{$1} $2');
      processedFormula = processedFormula.replace(/([+\-*/×=])\s*\\text\{/g, '$1 \\text{');
    }

    // 2. Fix special characters in text mode
    processedFormula = processedFormula.replace(
      /\\text\{([^}]*)\s+\*\s+([^}]*)\}/g,
      '\\text{$1 × $2}'
    );

    // 3. Replace plain asterisks with proper multiplication symbol
    processedFormula = processedFormula.replace(/([0-9])\s*\*\s*([0-9])/g, '$1 \\times $2');

    // 4. Ensure proper spacing around math operators
    processedFormula = processedFormula.replace(/([0-9])\\times([0-9])/g, '$1 \\times $2');
    processedFormula = processedFormula.replace(/([0-9])=([0-9])/g, '$1 = $2');

    return processedFormula;
  };

  // Function to attempt typesetting
  const attemptTypeset = useCallback(async () => {
    if (!formulaRef.current || renderAttempts >= maxRenderAttempts) return;

    const mathJaxInstance = (window as { MathJax?: { typesetPromise?: (elements: HTMLElement[]) => Promise<void> } })
      .MathJax?.typesetPromise;

    if (mathJaxInstance) {
      try {
        setRenderAttempts((prev) => prev + 1);

        await mathJaxInstance([formulaRef.current!]);
      } catch (error) {
        console.error(`Typesetting error on attempt ${renderAttempts}:`, error);

        // Retry with fallback approach
        if (renderAttempts < maxRenderAttempts) {
          console.log(`Retrying with fallback approach, attempt ${renderAttempts + 1}`);
          if (formulaRef.current) {
            formulaRef.current.innerHTML = `\\(${formula.replace(/[$\\()[\]]/g, '')}\\)`;
          }

          // Schedule another typeset attempt
          setTimeout(attemptTypeset, 500);
        }
      }
    } else if (renderAttempts < maxRenderAttempts) {
      // MathJax not available yet, try again later
      setTimeout(attemptTypeset, 100);
    }
  }, [formula, renderAttempts]);

  useEffect(() => {
    if (!formulaRef.current || !formula) return;

    const processedFormula = preprocessFormula(formula);

    // Set the preprocessed formula
    if (formulaRef.current) {
      formulaRef.current.innerHTML = processedFormula;
    }

    // Start the typesetting process
    attemptTypeset();
  }, [formula, attemptTypeset]); // Added `attemptTypeset` to the dependency array

  return <div ref={formulaRef} className={className}></div>;
};

export default EnhancedFormulaRenderer;