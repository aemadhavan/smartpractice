// File: /src/lib/mathjax-config.ts

// Enhanced formula processing function
const processMathExpression = (expression: string | undefined): string => {
  if (!expression || expression.trim() === '') {
    return '';
  }

  let processedExpr = expression.trim();
  
  // Special case for the common quiz formula pattern
  if (processedExpr.includes('\\text{Total outfits)') || 
      processedExpr.includes('Number of t-shirts') || 
      processedExpr.includes('Number of shorts')) {
    
    // Fix the specific pattern with unclosed text commands
    processedExpr = processedExpr
      .replace(/\\text\{\(Total outfits\)[^}]*\}/g, '\\text{(Total outfits)}')
      .replace(/\\text\{\(Number of t-shirts\)[^}]*\}/g, '\\text{(Number of t-shirts)}')
      .replace(/\\text\{\(Number of shorts\)[^}]*\}/g, '\\text{(Number of shorts)}');
  }
  
  // Continue with your existing processing...
  processedExpr = processedExpr
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Fix common escaping issues with LaTeX commands
    .replace(/\\\\text/g, '\\text')
    .replace(/\\\\times/g, '\\times')
    // ...rest of your existing code
    // Add additional fixes for common formatting issues
  .replace(/(\d+)\s*\\times\s*([a-zA-Z])/g, '$1\\times $2') // Add space after \times
  .replace(/(\d+)\s*times\s*([a-zA-Z])/g, '$1\\times $2')   // Convert "times" to \times
  .replace(/\b(\d+)([a-zA-Z])\b/g, '$1$2')                  // Fix "3x" formatting without spaces
  // Simplify basic expressions to avoid recursive processing
  //.replace(/(\d+)\s*\\times\s*x/g, '$1x') 

  // Add more robust handling of nested \text commands
  processedExpr = processedExpr.replace(/\\text\{([^{}]*)\}/g, (match, content) => {
    // Count opening and closing braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      // Add missing closing braces
      return `\\text{${content}}${'}'.repeat(openBraces - closeBraces)}`;
    }
    return match;
  });
  
  // Ensure \text commands have proper braces
  processedExpr = processedExpr.replace(/\\text([^{])/g, '\\text{$1}');
  
  // Fix nested \text commands without braces
  processedExpr = processedExpr.replace(/\\text\{([^{}]*)(\\text)([^{])/g, '\\text{$1}\\text{$3}');

  return processedExpr;
};

// Utility function to process explanation with math delimiters
const processExplanation = (explanation: string): string => {
  if (!explanation || explanation.trim() === '') {
    console.warn('Empty or undefined explanation provided');
    return '';
  }

  // Define regex to match math sections
  const mathRegex = /(\$\$|\$|\\[\[\(])(.*?)(\$\$|\$|\\[\]\)])/gs;
  const mathSections = [];
  let tempExplanation = explanation;
  
  // Extract math sections to protect them from text processing
  let mathMatch;
  let i = 0;
  
  while ((mathMatch = mathRegex.exec(tempExplanation)) !== null) {
    const placeholder = `__MATH_PLACEHOLDER_${i}__`;
    
    // Process the math content to fix any issues with \text commands
    let mathContent = mathMatch[2];
    
    // Fix nested \text commands by ensuring proper braces
    mathContent = mathContent.replace(/\\text\{([^{}]*)\}/g, (match, content) => {
      // Check if content contains an opening brace without a closing one
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      
      if (openBraces > closeBraces) {
        // Add missing closing braces
        return `\\text{${content}}${'}'.repeat(openBraces - closeBraces)}`;
      }
      return match;
    });
    
    // Ensure \text commands have proper braces
    mathContent = mathContent.replace(/\\text([^{])/g, '\\text{$1}');
    
    // Fix nested \text commands without braces
    mathContent = mathContent.replace(/\\text\{([^{}]*)(\\text)([^{])/g, '\\text{$1}\\text{$3}');
    
    mathSections.push({
      placeholder,
      original: mathMatch[1] + mathContent + mathMatch[3],
      content: mathContent
    });
    
    tempExplanation = tempExplanation.replace(mathMatch[0], placeholder);
    i++;
  }
  
  // Now process the text more aggressively
  let processedText = tempExplanation;
  
  // 1. Break up camelCase and lowercase+uppercase patterns
  processedText = processedText.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // 2. Break up joined words (This is a more aggressive approach)
  // Look for patterns like "ratio2" or "2boys"
  processedText = processedText.replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');
  processedText = processedText.replace(/(\d+)([a-zA-Z]+)/g, '$1 $2');
  
  // 3. Add spaces after punctuation
  processedText = processedText.replace(/([,.;:])([^\s])/g, '$1 $2');
  
  // 4. Fix ratio notation
  processedText = processedText.replace(/(\d+)\s*:\s*(\d+)/g, '$1 : $2');
  
  // 5. Add spaces around operators
  processedText = processedText
    .replace(/(\d+)\s*([+\-×÷=])\s*(\d+)/g, '$1 $2 $3')
    .replace(/(\d+)×(\d+)/g, '$1 × $2')
    .replace(/(\d+)=(\d+)/g, '$1 = $2')
    .replace(/(\d+)\+(\d+)/g, '$1 + $2')
    .replace(/(\d+)-(\d+)/g, '$1 - $2')
    .replace(/(\d+)\/(\d+)/g, '$1 / $2')
    .replace(/(\d+)÷(\d+)/g, '$1 ÷ $2');
  
  // Replace math placeholders with processed math content
  for (const section of mathSections) {
    // Process the math content if needed
    processedText = processedText.replace(
      section.placeholder,
      section.original
    );
  }
  
  return processedText;
};

// Enhanced error logging utility with additional context
const logMathJaxError = (error: unknown, context?: string) => {
  console.error('MathJax Rendering Error:', {
    error,
    context: context || 'No additional context provided',
    stack: error instanceof Error ? error.stack : undefined
  });
  return ''; // Return empty string to prevent rendering issues
};

// Helper function to typeset MathJax content
const typesetMathJax = (element: HTMLElement | null) => {
  if (!element) return;
  
  // Check if MathJax is available
  if (typeof window !== 'undefined' && 'MathJax' in window) {
    const MathJax = window.MathJax;
    
    // Wait for MathJax to be fully loaded
    if (MathJax && MathJax.typesetPromise) {
      // Process the content
      try {
        // Typeset the math in the container
        MathJax.typesetPromise([element]).catch((err: Error) => {
          console.error('MathJax typesetting failed:', err);
        });
      } catch (error) {
        console.error('Error processing MathJax:', error);
      }
    }
  }
};

export { 
  processMathExpression, 
  processExplanation,
  logMathJaxError,
  typesetMathJax
};