//File : /src/components/math/UnifiedMathLayout.tsx

'use client';

import React from 'react';
import { MathJaxContext } from 'better-react-mathjax';

interface UnifiedMathLayoutProps {
  children: React.ReactNode;
}

export const UnifiedMathLayout: React.FC<UnifiedMathLayoutProps> = ({ children }) => {
  // Advanced MathJax configuration
  const config = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true,
      maxMacros: 5000,  // Set a reasonable limit on macro expansion
    maxBuffer: 5 * 1024,  // Increase buffer size
      macros: {
        // Common macros for counting principles
        Total: "\\text{Total}",
        Number: "\\text{Number}",
        //times: "\\times",
        // Add common macros for trigonometric functions
        sin: "\\sin",
        cos: "\\cos",
        tan: "\\tan"
      },
      packages: {'[+]': ['ams', 'noerrors', 'color', 'boldsymbol', 'unicode']}
    },
    options: {
      enableMenu: false,
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      processHtmlClass: 'math-formula',
      ignoreHtmlClass: 'no-mathjax'
    },
    startup: {
      typeset: false, // Set to false initially for better performance
      ready: () => {
        if (typeof window !== 'undefined') {
          // Create a global flag to indicate MathJax is ready
          window.mathJaxReady = true;
          
          // Create a global function for legacy component support
          window.safeTypesetMathJax = (elements?: HTMLElement[]) => {
            if (window.MathJax && window.MathJax.typesetPromise) {
              return window.MathJax.typesetPromise(elements || [])
                .catch((err: Error) => console.error('MathJax typesetting failed:', err));
            }
            return Promise.resolve();
          };
          
          // Ready callback from MathJax
          if (window.MathJax && window.MathJax.startup) {
            window.MathJax.startup.defaultReady();
            console.log('MathJax is ready for rendering');
          }
        }
      }
    }
  };

  return (
    <MathJaxContext 
      config={config} 
      version={3}
      onLoad={() => console.log("MathJax loaded successfully")}
      onError={(error: Error) => console.error("MathJax failed to load:", error)}
    >
      {children}
    </MathJaxContext>
  );
};