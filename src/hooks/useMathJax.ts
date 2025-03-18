// Custom hook for MathJax rendering
'use client';
import { useEffect, useRef, DependencyList } from 'react';
// No local MathJax interface or window augmentation needed

/**
 * Custom hook to handle MathJax rendering in components
 * @param content The content containing LaTeX to render
 * @param dependencies Additional dependencies that should trigger re-rendering
 * @returns A ref object to attach to the container element
 */
export function useMathJax(content: string, dependencies: DependencyList = []) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Skip if no content or no container
    if (!content || !containerRef.current) return;

    // Check if MathJax is available in the window object
    if (typeof window !== 'undefined' && 'MathJax' in window) {
      const MathJax = window.MathJax;
      
      // Only proceed if MathJax is fully loaded with typesetPromise
      if (MathJax && MathJax.typesetPromise) {
        try {
          // Queue the typesetting of the container
          MathJax.typesetPromise([containerRef.current])
            .catch((err: Error) => {
              console.error('MathJax typesetting failed:', err);
            });
        } catch (error) {
          console.error('Error processing MathJax:', error);
        }
      } else {
        console.warn('MathJax is not fully loaded yet');
      }
    } else {
      console.warn('MathJax is not available in the window object');
    }
  }, [content, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  return containerRef;
}

/**
 * Checks if a string contains LaTeX content
 * @param content The string to check
 * @returns boolean indicating if the string contains LaTeX
 */
export function containsLatex(content: string): boolean {
  if (!content) return false;
  
  return (
    content.includes('$') || 
    content.includes('\\(') || 
    content.includes('\\[') || 
    content.includes('\\begin{') ||
    content.includes('\\frac') || 
    content.includes('\\text') || 
    content.includes('\\times') ||
    content.includes('\\div') ||
    content.includes('\\cdot')
  );
}

/**
 * Ensures LaTeX content has proper delimiters
 * @param content The content to process
 * @returns The content with proper LaTeX delimiters
 */
export function ensureLatexDelimiters(content: string): string {
  if (!content) return '';
  
  // Check if already has delimiters
  const hasDelimiters = 
    (content.startsWith('$') && content.endsWith('$')) ||
    (content.startsWith('\\(') && content.endsWith('\\)')) ||
    (content.startsWith('\\[') && content.endsWith('\\]')) ||
    (content.startsWith('$$') && content.endsWith('$$'));
    
  if (hasDelimiters) return content;
  
  // Add inline math delimiters
  return `$${content}$`;
}