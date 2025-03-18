// QuizMathRenderer.tsx - Using custom hook for rendering math
'use client';
import React, { useEffect, useRef } from 'react';
import { containsLatex, ensureLatexDelimiters } from '@/hooks/useMathJax';
import { processMathExpression } from '@/lib/mathjax-config';

interface QuizMathRendererProps {
  content: string;
}

// Define a type for the window with MathJax properties
interface ExtendedWindow extends Window {
  mathJaxReady?: boolean;
  safeTypesetMathJax?: (elements?: HTMLElement[]) => Promise<void>;
}

/**
 * QuizMathRenderer - A component for rendering math content in quizzes
 * Handles MathJax rendering with direct DOM manipulation
 */
const QuizMathRenderer: React.FC<QuizMathRendererProps> = ({ content }) => {
  // Create a ref for direct MathJax typesetting - moved before conditional return
  const containerRef = useRef<HTMLSpanElement>(null);
  
  // Call hooks before any conditional returns
  const mathRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !content) return;
    
    // Use the global safeTypesetMathJax function if available
    if (typeof window !== 'undefined') {
      // Wait for MathJax to be fully loaded and ready
      const waitForMathJax = () => {
        const extWindow = window as ExtendedWindow;
        if (extWindow.mathJaxReady && extWindow.safeTypesetMathJax) {
          // Use the global safe typesetting function
          void extWindow.safeTypesetMathJax([containerRef.current as HTMLElement]);
        } else {
          // Check again in 100ms
          setTimeout(waitForMathJax, 100);
        }
      };
      
      // Start waiting for MathJax to be ready
      waitForMathJax();
    }
  }, [content]);

  if (!content) return null;
  
  // Check if content contains LaTeX
  const hasLatex = containsLatex(content);
  
  // For plain text without LaTeX, just render it directly
  if (!hasLatex) {
    return <span>{content}</span>;
  }
  
  // First process the content to fix any issues with LaTeX commands
  // This will handle nested \text commands and other LaTeX formatting issues
  let fixedContent = content;
  
  // Check if the content contains \text commands that might need fixing
  if (content.includes('\\text')) {
    try {
      // Use the enhanced processMathExpression function to fix LaTeX issues
      // This will properly handle nested \text commands and ensure proper braces
      fixedContent = processMathExpression(content);
      
      // If the function added delimiters but the content already had them,
      // we need to remove the extra ones
      if (
        (fixedContent.startsWith('\\(') && content.startsWith('$')) ||
        (fixedContent.startsWith('\\[') && content.startsWith('$$'))
      ) {
        // Extract the content without the added delimiters
        fixedContent = fixedContent.slice(2, -2);
      }
    } catch (error) {
      console.error('Error processing math content:', error);
      // Fall back to the original content if processing fails
      fixedContent = content;
    }
  }
  
  // Process the content to ensure it has proper LaTeX delimiters
  const processedContent = ensureLatexDelimiters(fixedContent);
  
  // Apply MathJax rendering logic
  // We'll handle this with our existing refs and useEffect
  
  // For LaTeX content, use our ref and dangerouslySetInnerHTML
  return (
    <span 
      ref={(el) => {
        // Assign to both refs
        if (el) {
          mathRef.current = el;
          containerRef.current = el;
        }
      }}
      className="math-content" 
      dangerouslySetInnerHTML={{ __html: processedContent }} 
    />
  );
};

export default QuizMathRenderer;