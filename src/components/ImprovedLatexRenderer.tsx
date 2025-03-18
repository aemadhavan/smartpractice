// File: /src/components/ImprovedLatexRenderer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MathJax as MathJaxType } from '../types/mathjax'; // Import MathJax type

interface ImprovedLatexRendererProps {
  formula: string | null | undefined;
  className?: string;
  forceRender?: boolean;
}

/**
 * An enhanced component for rendering LaTeX formulas reliably
 * Handles a wide variety of LaTeX expressions and edge cases
 */
const ImprovedLatexRenderer: React.FC<ImprovedLatexRendererProps> = ({
  formula,
  className = "math-formula",
  forceRender = false,
}) => {
  const formulaRef = useRef<HTMLDivElement>(null);
  const [attempts, setAttempts] = useState(0);
  const [rendered, setRendered] = useState(false);
  const [processedFormula, setProcessedFormula] = useState<string>('');

  // Process the formula to ensure it has proper LaTeX delimiters
  const processFormula = (input: string | null | undefined): string => {
    if (!input || input.trim() === '' || input === 'empty string') {
      return '';
    }

    let processed = input.trim();

    // Replace any escaped backslashes with single backslashes for rendering
    processed = processed.replace(/\\\\/g, '\\');

    // Normalize malformed LaTeX commands
    processed = processed
      .replace(/\\leq/g, '\\leq ')
      .replace(/\\geq/g, '\\geq ')
      .replace(/\\neq/g, '\\neq ')
      .replace(/\\text{/g, '\\text{')
      .replace(/\\frac{/g, '\\frac{')
      .replace(/\\Rightarrow/g, '\\Rightarrow ');

    // Fix any common issues with \text commands
    processed = processed.replace(/\\text(\w+)/g, '\\text{$1}');

    // Check if the input already has delimiters
    const hasDelimiters = (
      processed.startsWith('$') && processed.endsWith('$') ||
      processed.startsWith('$$') && processed.endsWith('$$') ||
      processed.startsWith('\\(') && processed.endsWith('\\)') ||
      processed.startsWith('\\[') && processed.endsWith('\\]')
    );

    // If it already has delimiters, leave it as is
    if (hasDelimiters) {
      return processed;
    }

    // Handle special cases with brackets or braces
    if (processed.includes('{') && !processed.includes('}')) {
      processed = processed + '}';
    }

    // If no delimiters, add them
    return `$$${processed}$$`;
  };

  // Effects must be called regardless of formula content to maintain hook order
  useEffect(() => {
    // Process the formula first
    const result = processFormula(formula);
    setProcessedFormula(result);

    // Reset counters
    setAttempts(0);
    setRendered(false);

    // Apply the formula to the DOM if we have content
    if (formulaRef.current && result) {
      formulaRef.current.innerHTML = result;

      // Schedule initial typesetting attempts
      const attemptInitialTypeset = () => {
        if (typeof window !== 'undefined' && window.MathJax?.typesetPromise) {
          const mathJaxInstance = window.MathJax as MathJaxType; // Explicitly use MathJax type
          try {
            mathJaxInstance.typesetPromise([formulaRef.current as HTMLElement]).catch(() => {
              // Silent catch - will retry in main typesetting logic
            });
          } catch {
            // Silent catch - will retry in main typesetting logic
          }
        }
      };

      // Try immediately and after several delays
      attemptInitialTypeset();
      [100, 300, 500].forEach(delay => {
        setTimeout(attemptInitialTypeset, delay);
      });
    }
  }, [formula]);

  // Main typesetting logic in a separate effect to maintain hook order
  useEffect(() => {
    // Skip if no content to render
    if (!processedFormula || processedFormula.length === 0) {
      return;
    }

    // Skip if already rendered or no DOM element
    if (!formulaRef.current || rendered) {
      return;
    }

    // Schedule multiple typesetting attempts with increasing delays
    const delays = [200, 500, 1000, 1500, 2000, 3000];

    delays.forEach((delay, index) => {
      setTimeout(() => {
        // Skip if already rendered or component unmounted
        if (rendered || !formulaRef.current) return;

        // Increment attempt counter
        setAttempts(prev => prev + 1);

        if (typeof window !== 'undefined' && window.MathJax?.typesetPromise) {
          const mathJaxInstance = window.MathJax as MathJaxType; // Explicitly use MathJax type
          try {
            // Try to typeset
            mathJaxInstance.typesetPromise([formulaRef.current as HTMLElement])
              .then(() => {
                setRendered(true);
              })
              .catch(() => {
                // On error, try with a different wrapping approach
                if (formulaRef.current && index < delays.length - 1) {
                  // Try several different approaches to rendering the formula
                  const approaches = [
                    `$$${processedFormula.replace(/[$\\()[\]]/g, '')}$$`, // Display math
                    `\\(${processedFormula.replace(/[$\\()[\]]/g, '')}\\)`, // Inline math
                    `$${processedFormula.replace(/[$\\()[\]]/g, '')}$`, // Inline math alternate
                    `\\begin{equation*}${processedFormula.replace(/[$\\()[\]]/g, '')}\\end{equation*}`, // Equation environment
                    `\\begin{align*}${processedFormula.replace(/[$\\()[\]]/g, '')}\\end{align*}`, // Align environment
                  ];

                  // Use a different approach for each attempt
                  formulaRef.current.innerHTML = approaches[index % approaches.length];
                }
              });
          } catch {
            // Silent catch - will try again in next iteration
          }
        }
      }, delay);
    });

    // Force re-rendering on route change
    if (forceRender) {
      const timer = setTimeout(() => {
        if (formulaRef.current && !rendered && processedFormula) {
          formulaRef.current.innerHTML = processedFormula;

          if (typeof window !== 'undefined' && window.MathJax?.typesetPromise) {
            const mathJaxInstance = window.MathJax as MathJaxType; // Explicitly use MathJax type
            mathJaxInstance.typesetPromise([formulaRef.current as HTMLElement]).catch(() => {
              // Silent catch
            });
          }
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [processedFormula, rendered, forceRender]);

  // Fallback rendering - for when MathJax fails
  useEffect(() => {
    // If we've tried many times but still failed to render,
    // show the raw formula with basic styling instead
    if (attempts > 8 && !rendered && formulaRef.current) {
      const fallbackFormulaDisplay = document.createElement('div');
      fallbackFormulaDisplay.className = 'math-formula-fallback';
      fallbackFormulaDisplay.style.fontFamily = 'monospace';
      fallbackFormulaDisplay.style.padding = '8px';
      fallbackFormulaDisplay.style.backgroundColor = '#f8f9fa';
      fallbackFormulaDisplay.style.border = '1px solid #dee2e6';
      fallbackFormulaDisplay.style.borderRadius = '4px';
      fallbackFormulaDisplay.textContent = formula || '';

      formulaRef.current.innerHTML = '';
      formulaRef.current.appendChild(fallbackFormulaDisplay);

      // Consider it "rendered" so we stop trying
      setRendered(true);
    }
  }, [attempts, rendered, formula]);

  // If no valid formula, return an empty div to maintain DOM structure
  if (!processedFormula || processedFormula.length === 0) {
    return <div className={className}></div>;
  }

  return (
    <div
      ref={formulaRef}
      className={className}
      data-testid="latex-formula"
      aria-label="Mathematical formula"
    ></div>
  );
};

export default ImprovedLatexRenderer;