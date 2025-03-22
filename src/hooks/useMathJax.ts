//File: /src/hooks/useMathJax.ts
// Enhanced hook for MathJax rendering with better performance and UX
'use client';
import { useEffect, useRef, useState, DependencyList, useCallback } from 'react';
import { MathJax as MathJaxType } from '@/types/mathjax';

// Define a proper interface for the Window with MathJax
interface WindowWithMathJax extends Window {
  mathJaxReady?: boolean;
  safeTypesetMathJax?: (elements?: HTMLElement[]) => Promise<void>;
  MathJax?: MathJaxType;
}

interface UseMathJaxOptions {
  elementRef?: React.RefObject<HTMLElement>;
  delay?: number;
  fallbackDelay?: number;
  debugLabel?: string;
  onProcessed?: () => void;
  maxAttempts?: number; // Added option for configurable max attempts
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
  dependencies: readonly unknown [] = [], 
  options: UseMathJaxOptions = {}
): UseMathJaxResult {
  const {
    elementRef,
    delay = 100,
    fallbackDelay = 1500,
    debugLabel = 'MathJax',
    onProcessed,
    maxAttempts = 5 // Increased from 3 to 5 attempts
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
  
  // Check if MathJax is available
  const isMathJaxAvailable = useCallback(() => {
    const win = window as unknown as WindowWithMathJax;
    return (win.mathJaxReady && win.safeTypesetMathJax) || 
           (win.MathJax && typeof win.MathJax.typesetPromise === 'function');
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
      if (attemptCountRef.current > maxAttempts) {
        console.warn(`[${debugLabel}] Max MathJax processing attempts (${maxAttempts}) reached, skipping`);
        setIsProcessing(false);
        setIsProcessed(true);
        cleanup();
        
        if (onProcessed) onProcessed();
        return;
      }
      
      // Wait for MathJax to become available with a timeout
      if (!isMathJaxAvailable()) {
        const checkInterval = 100; // Check every 100ms
        let waitTime = 0;
        const maxWaitTime = 2000; // Wait at most 2 seconds
        
        while (!isMathJaxAvailable() && waitTime < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          waitTime += checkInterval;
        }
        
        if (!isMathJaxAvailable()) {
          throw new Error('MathJax not available after waiting');
        }
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
      
      // Retry after a short delay if we haven't exceeded max attempts
      if (attemptCountRef.current <= maxAttempts) {
        cleanup();
        processingTimerRef.current = setTimeout(() => {
          processMathJax();
        }, 300); // Retry after 300ms
        return;
      }
      
      // Still mark as processed to prevent UI blocking
      setIsProcessing(false);
      setIsProcessed(true);
      
      if (onProcessed) onProcessed();
    }
  }, [cleanup, debugLabel, fallbackDelay, onProcessed, elementRef, maxAttempts, isMathJaxAvailable]);
  
  // Set up effect to process MathJax when dependencies change
  useEffect(() => {
    mountedRef.current = true;
    setIsProcessed(false);
    cleanup();
    
    // Reset attempt counter when dependencies change
    attemptCountRef.current = 0;
    
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



