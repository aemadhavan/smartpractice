// File: /src/components/SpecialFormula.tsx
import React, { useEffect, useRef } from 'react';
// Import MathJax type from your centralized types file
import '../types/mathjax'; // Only import for side effects (global augmentation)

interface SpecialFormulaProps {
  formula: string;
}

const SpecialFormula: React.FC<SpecialFormulaProps> = ({ formula }) => {
  const formulaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formulaRef.current) {
      // Directly set the HTML with the correct LaTeX
      formulaRef.current.innerHTML = formula;
      
      // Schedule multiple typesetting attempts
      [100, 500, 1000, 2000].forEach(delay => {
        setTimeout(() => {
          // Verify ref is still valid within the setTimeout
          if (typeof window !== 'undefined' && window.MathJax?.typesetPromise && formulaRef.current) {
            try {
              // The non-null assertion is safe here because we've already checked formulaRef.current
              window.MathJax.typesetPromise([formulaRef.current])
                .catch((err: Error) => console.error(`Typesetting error at ${delay}ms:`, err));
            } catch (error) {
              console.error(`MathJax error at ${delay}ms:`, error);
            }
          }
        }, delay);
      });
    }
  }, [formula]);

  return <div ref={formulaRef} className="math-formula"></div>;
};

export default SpecialFormula;