// File: /src/components/quantitative/Layout.tsx
'use client';

import React, { ReactNode } from 'react';
import Head from 'next/head';
import { MathJaxContext } from 'better-react-mathjax';


interface QuantitativeLayoutProps {
  children: ReactNode;
}

export const QuantitativeLayout: React.FC<QuantitativeLayoutProps> = ({ 
  children 
}) => {
  const config = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      // Reduce these values to prevent stack overflow
      maxMacros: 50,
      maxBuffer: 1024
    },
    options: {
      enableMenu: false,
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      processHtmlClass: 'math-formula',
      ignoreHtmlClass: 'no-mathjax'
    },
    startup: {
      typeset: true,
      ready: () => {
        if (typeof window !== 'undefined') {
          try {
            window.mathJaxReady = true;
            
            // Simple typeset function with basic error handling
            window.safeTypesetMathJax = async (elements?: HTMLElement[]) => {
              if (!window.MathJax || !window.MathJax.typesetPromise) {
                return Promise.resolve();
              }
              
              try {
                return await window.MathJax.typesetPromise(elements || []);
              } catch (err) {
                console.error('MathJax typesetting failed:', err);
                return Promise.resolve();
              }
            };
            
            if (window.MathJax && window.MathJax.startup) {
              window.MathJax.startup.defaultReady();
              console.log('MathJax is ready for rendering');
            }
          } catch (error) {
            console.error('Error initializing MathJax:', error);
          }
        }
      }
    }
  };

  return (
    <>
      <Head>
        <title>Quantitative Practice - Smart Practice</title>
      </Head>
      <MathJaxContext
        config={config} 
        version={3}
        onLoad={() => console.log("MathJax loaded successfully")}
        onError={(error: Error) => console.error("MathJax failed to load:", error)}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
      </MathJaxContext>
    </>
  );
};