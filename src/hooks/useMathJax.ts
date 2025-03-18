//File: /src/hooks/useMathJax.ts
// Enhanced hook for MathJax rendering with better performance and UX
'use client';
import { useEffect, useRef, useState, DependencyList, useCallback } from 'react';

// Define a proper interface for the Window with MathJax
interface WindowWithMathJax extends Window {
  mathJaxReady?: boolean;
  safeTypesetMathJax?: (elements?: HTMLElement[]) => Promise<void>;
  MathJax?: any;
}

interface UseMathJaxOptions {
  elementRef?: React.RefObject<HTMLElement>;
  delay?: number;
  fallbackDelay?: number;
  debugLabel?: string;
  onProcessed?: () => void;
}

interface UseMathJaxResult {
  isProcessing: boolean;
  isProcessed: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Enhanced hook for MathJax processing with better performance and UX
 * @param dependencies Array of dependencies that should trigger reprocessing
 * @param options Configuration options for the hook
 * @returns Object with processing state
 */
export function useMathJax(
  dependencies: any[] = [], 
  options: UseMathJaxOptions = {}
): UseMathJaxResult {
  const {
    elementRef,
    delay = 100,
    fallbackDelay = 1500, // Increase this timeout
    debugLabel = 'MathJax',
    onProcessed
  } = options;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  
  // Use refs to track timers and state across renders
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const mountedRef = useRef(true);
  const containerRef = useRef<HTMLElement | null>(null);
  
  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);
  
  // Process MathJax content
  const processMathJax = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsProcessing(true);
    attemptCountRef.current++;
    
    try {
      // Set a fallback timer to avoid UI getting stuck
      fallbackTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        
        console.warn(`[${debugLabel}] Fallback timer triggered`);
        setIsProcessing(false);
        setIsProcessed(true);
        
        if (onProcessed) onProcessed();
      }, fallbackDelay);
      
      // Limit retry attempts
      if (attemptCountRef.current > 3) {
        console.warn(`[${debugLabel}] Too many MathJax processing attempts, skipping`);
        setIsProcessing(false);
        setIsProcessed(true);
        cleanup();
        
        if (onProcessed) onProcessed();
        return;
      }
      
      // Try to process using the appropriate MathJax method
      const win = window as unknown as WindowWithMathJax;
      
      // Determine which elements to process
      let elements: HTMLElement[] | undefined;
      if (elementRef?.current) {
        elements = [elementRef.current];
      } else if (containerRef.current) {
        elements = [containerRef.current];
      }
      
      if (win.mathJaxReady && win.safeTypesetMathJax) {
        await win.safeTypesetMathJax(elements);
      } else if (win.MathJax?.typesetPromise) {
        await win.MathJax.typesetPromise(elements || []);
      } else {
        throw new Error('MathJax not available');
      }
      
      // Successful processing
      if (!mountedRef.current) return;
      
      cleanup();
      setIsProcessing(false);
      setIsProcessed(true);
      
      if (onProcessed) onProcessed();
    } catch (error) {
      console.error(`[${debugLabel}] Error processing MathJax:`, error);
      
      if (!mountedRef.current) return;
      
      // Still mark as processed to prevent UI blocking
      setIsProcessing(false);
      setIsProcessed(true);
      
      if (onProcessed) onProcessed();
    }
  }, [cleanup, debugLabel, fallbackDelay, onProcessed, elementRef]);
  
  // Set up effect to process MathJax when dependencies change
  useEffect(() => {
    mountedRef.current = true;
    setIsProcessed(false);
    cleanup();
    
    // Delay processing to allow component to render first
    processingTimerRef.current = setTimeout(() => {
      processMathJax();
    }, delay);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, delay, debugLabel]);
  
  return { isProcessing, isProcessed, containerRef };
}

/**
 * Legacy version of the hook for backward compatibility
 * @param content The content containing LaTeX to render
 * @param dependencies Additional dependencies that should trigger re-rendering
 * @returns A ref object to attach to the container element
 */
export function useMathJaxLegacy(content: string, dependencies: DependencyList = []): React.RefObject<HTMLElement | null> {
  const { containerRef } = useMathJax([content, ...dependencies]);
  return containerRef;
}

/**
 * Checks if a string contains LaTeX content
 * @param content The string to check
 * @returns boolean indicating if the string contains LaTeX
 */
export function containsLatex(text: string): boolean {
  if (!text) return false;
  
  // More reliable LaTeX detection
  const commonPatterns = text.includes('$') || 
                        text.includes('\\') || 
                        text.includes('^') || 
                        text.includes('_');
  
  if (!commonPatterns) return false;
  
  // Check for common LaTeX patterns
  return /(\$|\\\(|\\\[|\\begin\{|\\frac|\\text)/.test(text);
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