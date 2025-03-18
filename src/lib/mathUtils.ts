//File: /src/lib/mathUtils.ts

/**
 * Efficient utility functions for math content processing
 * These are optimized to prevent performance issues and stack overflows
 */

// Cache for LaTeX detection results to avoid repeated regex testing
const latexDetectionCache = new Map<string, boolean>();
const MAX_CACHE_SIZE = 100;

/**
 * Checks if a string might contain LaTeX content
 * Uses caching for performance and avoids excessive regex
 */
export function mightContainLatex(text: string): boolean {
  // Handle empty input
  if (!text || typeof text !== 'string') return false;
  
  // Check cache first
  if (latexDetectionCache.has(text)) {
    return latexDetectionCache.get(text) || false;
  }
  
  // Quick rejection for short strings without special characters
  if (text.length < 3 || 
      (!text.includes('$') && 
       !text.includes('\\') && 
       !text.includes('^') && 
       !text.includes('_'))) {
    
    // Cache negative result
    maintainCacheSize();
    latexDetectionCache.set(text, false);
    return false;
  }
  
  // More specific check for LaTeX delimiters or common LaTeX commands
  const result = /(\$|\\\(|\\\[|\\begin\{|\\frac|\\text|\\sum|\\int)/.test(text);
  
  // Cache result
  maintainCacheSize();
  latexDetectionCache.set(text, result);
  
  return result;
}

/**
 * Ensures LaTeX content has proper delimiters
 */
export function ensureLatexDelimiters(content: string, inline: boolean = true): string {
  if (!content) return '';
  
  // Check if already has delimiters
  const hasDelimiters = 
    (content.startsWith('$') && content.endsWith('$')) ||
    (content.startsWith('\\(') && content.endsWith('\\)')) ||
    (content.startsWith('\\[') && content.endsWith('\\]')) ||
    (content.startsWith('$$') && content.endsWith('$$'));
    
  if (hasDelimiters) return content;
  
  // Add appropriate delimiters based on display mode
  return inline ? `$${content}$` : `$$${content}$$`;
}

/**
 * Maintains a reasonable cache size to prevent memory issues
 */
function maintainCacheSize(): void {
  if (latexDetectionCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries when cache gets too large
    const keysToDelete = Array.from(latexDetectionCache.keys()).slice(0, 20);
    keysToDelete.forEach(key => latexDetectionCache.delete(key));
  }
}

/**
 * Safely processes a math expression with error handling
 */
export function safeProcessMathExpression(
  expression: string, 
  fallback: string = ''
): string {
  try {
    if (!expression || typeof expression !== 'string') {
      return fallback;
    }
    
    // Simple processing for safety - actual implementation would depend on your needs
    return ensureLatexDelimiters(expression);
  } catch (error) {
    console.error('Error processing math expression:', error);
    return fallback || expression;
  }
}