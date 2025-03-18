import React, { useEffect, useRef } from 'react';

const CountingPrinciplesFormula: React.FC = () => {
  const formulaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formulaRef.current) {
      // Directly set the HTML with the correct LaTeX
      formulaRef.current.innerHTML =
        '$\\text{Total outfits} = \\text{Number of t-shirts} \\times \\text{Number of shorts} = 3 \\times 2 = 6$';

      // Schedule multiple typesetting attempts
      [100, 500, 1000, 2000].forEach((delay) => {
        setTimeout(() => {
          if (
            typeof window !== 'undefined' &&
            (window as { MathJax?: { typesetPromise?: (elements: HTMLElement[]) => Promise<void> } })
              .MathJax?.typesetPromise
          ) {
            const typesetPromise =
              (window as { MathJax?: { typesetPromise?: (elements: HTMLElement[]) => Promise<void> } })
                .MathJax?.typesetPromise;

            if (typesetPromise) {
              try {
                typesetPromise([formulaRef.current!])
                  .catch((err: unknown) => console.error(`Typesetting error at ${delay}ms:`, err));
              } catch (error) {
                console.error(`MathJax error at ${delay}ms:`, error);
              }
            }
          }
        }, delay);
      });
    }
  }, []);

  return <div ref={formulaRef} className="math-formula"></div>;
};

export default CountingPrinciplesFormula;