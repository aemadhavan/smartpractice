// File: /src/types/mathjax.ts

/**
 * MathJax startup interface
 */
export interface MathJaxStartup {
  defaultReady: () => void;
  promise?: Promise<void>;
}

/**
 * MathJax configuration options
 */
export interface MathJaxOptions {
  skipHtmlTags?: string[];
  ignoreHtmlClass?: string;
  processHtmlClass?: string;
}

/**
 * MathJax TeX options
 */
export interface MathJaxTexOptions {
  inlineMath?: string[][];
  displayMath?: string[][];
  processEscapes?: boolean;
  processEnvironments?: boolean;
}

/**
 * MathJax interface definition
 */
export interface MathJax {
  typesetPromise: (elements: HTMLElement[]) => Promise<void>;
  typeset?: (elements: HTMLElement[]) => void;
  tex2chtml?: (latex: string, options?: Record<string, any>) => HTMLElement;
  startup: MathJaxStartup;
  options?: MathJaxOptions;
  tex?: MathJaxTexOptions;
  [key: string]: any;
}

/**
 * MathJax document type for render actions
 */
export interface MathJaxDoc {
  math: Array<{
    state: (num?: number) => number;
  }>;
}

// Global window augmentation
declare global {
  interface Window {
    MathJax?: MathJax;
    mathJaxReady?: boolean;
    safeTypesetMathJax?: (elements?: HTMLElement[]) => Promise<void>;
  }
}