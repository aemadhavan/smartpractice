//File: /src/components/MathText.tsx - Component for handling mixed content (text and LaTeX)
'use client';
import React, { useEffect, useRef } from 'react';
import { containsLatex } from '@/hooks/useMathJax';
import { processExplanation } from '@/lib/mathjax-config';

// Import the correct MathJax type from project types
import type { MathJax } from '@/types/mathjax';

// Extend Window with the MathJax property
interface WindowWithMathJax extends Window {
  MathJax?: MathJax;
}

interface MathTextProps {
  content: string;
  className?: string;
}

/**
 * MathText - A component for rendering mixed content (text and LaTeX)
 * This component will automatically detect and render LaTeX content
 */
const MathText: React.FC<MathTextProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Skip if no content
    if (!content || !containerRef.current) return;
    
    // Check if MathJax is available and content contains LaTeX
    if (typeof window !== 'undefined' && 'MathJax' in window && containsLatex(content)) {
      const MathJax = (window as WindowWithMathJax).MathJax;
      
      // Only proceed if MathJax is fully loaded
      if (MathJax && MathJax.typesetPromise) {
        try {
          // Typeset just this container instead of the entire document
          MathJax.typesetPromise([containerRef.current])
            .catch((err: Error) => {
              console.error('MathJax typesetting failed:', err);
            });
        } catch (error) {
          console.error('Error processing MathJax:', error);
        }
      }
    }
  }, [content]);

  if (!content) return null;
  
  // Process the content to fix any LaTeX issues
  let processedContent = content;
  
  // Check if the content contains LaTeX that might need fixing
  if (containsLatex(content)) {
    try {
      // If content contains \text commands, use processExplanation
      // which handles mixed text and math content
      if (content.includes('\\text')) {
        processedContent = processExplanation(content);
      }
    } catch (error) {
      console.error('Error processing math content:', error);
      // Fall back to the original content if processing fails
      processedContent = content;
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`math-text ${className}`} 
      dangerouslySetInnerHTML={{ __html: processedContent }} 
    />
  );
};

export default MathText;