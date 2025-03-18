// File: /src/components/GenericLatexRenderer.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MathJax } from '@/types/mathjax'; // Import MathJax type from your centralized types file 

interface GenericLatexRendererProps {
  formula: string;
  className?: string;
  renderAttempts?: number;
  forceRender?: boolean;
}

/**
 * A generic component for rendering LaTeX formulas reliably
 * Works with any LaTeX formula without hardcoding patterns
 */
const GenericLatexRenderer: React.FC<GenericLatexRendererProps> = ({
  formula,
  className = "math-formula",
  renderAttempts = 10,
  forceRender = false,
}) => {
  const formulaRef = useRef<HTMLDivElement>(null);
  const [attempts, setAttempts] = useState(0);
  const [rendered, setRendered] = useState(false);

  // Process the formula to ensure it has proper LaTeX delimiters
  const processFormula = (input: string): string => {
    if (!input.trim()) return '';

    let processed = input.trim();

    // Replace escaped backslashes with single backslashes
    processed = processed.replace(/\\\\/g, '\\');

    // Strip existing delimiters
    const stripDelimiters = (str: string): string =>
      str
        .replace(/^\$+|\$+$/g, '') // Remove $ delimiters
        .replace(/^\\[\(\[]|\\[\)\]]$/g, '') // Remove \( \) or \[ \]
        .replace(/^\\begin\{.*?\}|\\end\{.*?\}$/g, ''); // Remove environments like \begin{} \end{}

    const strippedFormula = stripDelimiters(processed);

    // Add appropriate delimiters
    return `$${strippedFormula}$`;
  };

  // Function to attempt typesetting
  const attemptTypeset = useCallback((delay: number) => {
    setTimeout(() => {
      if (!formulaRef.current || rendered) return;

      const mathJaxInstance = (window.MathJax as MathJax | undefined)?.typesetPromise;
      if (mathJaxInstance) {
        try {
          console.log(`Attempting to typeset formula (attempt ${attempts + 1})`);

          mathJaxInstance([formulaRef.current])
            .then(() => {
              console.log('Formula typeset successfully');
              setRendered(true);
            })
            .catch((error: unknown) => {
              console.error(`Typesetting error on attempt ${attempts + 1}:`, error);

              // Retry with alternative wrapping methods
              if (attempts < renderAttempts - 1 && formulaRef.current) {
                const processed = processFormula(formula);
                formulaRef.current.innerHTML =
                  attempts % 2 === 0
                    ? `\\(${processed.replace(/[$\\()[\]]/g, '')}\\)`
                    : `$${processed.replace(/[$\\()[\]]/g, '')}$`;

                setAttempts(prev => prev + 1); // Increment attempts after retry
              }
            });
        } catch (error) {
          console.error(`MathJax error on attempt ${attempts + 1}:`, error);
        }
      } else {
        console.warn('MathJax not ready, waiting...');
      }
    }, delay);
  }, [attempts, rendered, formula, renderAttempts]); // Added dependencies here

  // Main effect to manage formula rendering
  useEffect(() => {
    if (!formulaRef.current || !formula) return;

    // Reset state when formula changes
    setAttempts(0);
    setRendered(false);

    // Process the formula and apply it to the DOM
    const processedFormula = processFormula(formula);
    formulaRef.current.innerHTML = processedFormula;

    // Schedule multiple typesetting attempts with increasing delays
    const delays = [50, 100, 200, 400, 700, 1000, 1500, 2000, 3000, 5000];
    const attemptQueue = delays.slice(0, renderAttempts).map(delay => () => attemptTypeset(delay));

    // Start the first attempt
    if (attemptQueue.length > 0) {
      attemptQueue[0]();
    }

    // Force re-rendering on route change or component re-renders
    if (forceRender) {
      const timer = setTimeout(() => {
        if (formulaRef.current && !rendered) {
          console.log('Forcing formula re-rendering');
          formulaRef.current.innerHTML = processedFormula;

          const mathJaxInstance = (window.MathJax as MathJax | undefined)?.typesetPromise;
          if (mathJaxInstance) {
            mathJaxInstance([formulaRef.current]).catch((error: unknown) =>
              console.error('Force typesetting failed:', error)
            );
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [formula, renderAttempts, rendered,forceRender, attemptTypeset]); // `attemptTypeset` already includes `rendered`

  // Monitor MathJax readiness
  useEffect(() => {
    if (!formulaRef.current || rendered) return;

    const checkMathJax = setInterval(() => {
      const mathJaxInstance = (window.MathJax as MathJax | undefined)?.typesetPromise;
      if (typeof window !== 'undefined' && window.mathJaxReady && mathJaxInstance) {
        clearInterval(checkMathJax);

        if (formulaRef.current) {
          const processedFormula = processFormula(formula);
          formulaRef.current.innerHTML = processedFormula;

          mathJaxInstance([formulaRef.current])
            .then(() => {
              setRendered(true);
              console.log('MathJax ready event: Formula typeset successfully');
            })
            .catch((error: unknown) => {
              console.error('MathJax ready event: Typesetting failed:', error);
            });
        }
      }
    }, 100);

    return () => clearInterval(checkMathJax);
  }, [formula, rendered]); // `rendered` is already included here

  return (
    <div
      ref={formulaRef}
      className={className}
      data-testid="latex-formula"
      aria-label="Mathematical formula"
    ></div>
  );
};

export default GenericLatexRenderer;