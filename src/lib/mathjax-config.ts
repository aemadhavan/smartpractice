// File: /src/lib/mathjax-config.ts

// Simplified MathJax configuration for better-react-mathjax
const config = {
  loader: { 
    load: ["[tex]/html"]
  },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [["\\(", "\\)"], ["$", "$"]],
    displayMath: [["\\[", "\\]"], ["$$", "$$"]],
    processEscapes: true,
    processEnvironments: true
  },
  startup: {
    typeset: true  // Force typesetting of the entire document
  }
};

// Utility function to process mathematical expressions with error handling
const processMathExpression = (expression: string | undefined): string => {
  if (!expression || expression.trim() === '') {
    console.warn('Empty or undefined math expression provided');
    return '';
  }

  // Trim and normalize the expression
  const trimmedExpr = expression.trim();
  
  // Check and normalize different math delimiter formats
  const mathDelimiters = [
    { start: '\\(', end: '\\)' },
    { start: '\\[', end: '\\]' },
    { start: '$$', end: '$$' },
    { start: '$', end: '$' }
  ];

  // Escape any existing HTML entities to prevent rendering issues
  const escapedExpr = trimmedExpr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Check if already properly delimited
  const isDelimited = mathDelimiters.some(delim => 
    escapedExpr.startsWith(delim.start) && escapedExpr.endsWith(delim.end)
  );

  // If not delimited, wrap in inline math
  if (!isDelimited) {
    return `\\(${escapedExpr}\\)`;
  }

  return escapedExpr;
};

// Utility function to process explanation with math delimiters
const processExplanation = (explanation: string): string => {
  if (!explanation || explanation.trim() === '') {
    console.warn('Empty or undefined explanation provided');
    return '';
  }

  // First, replace display math (between $$)
  let processedExplanation = explanation.replace(
    /\$\$(.*?)\$\$/g, 
    (match, group) => {
      const trimmedGroup = group.trim();
      if (!trimmedGroup) {
        console.warn('Empty display math group in explanation');
        return '';
      }
      return `\\[${trimmedGroup}\\]`;
    }
  );

  // Then, replace inline math (between $)
  processedExplanation = processedExplanation.replace(
    /\$(.*?)\$/g, 
    (match, group) => {
      const trimmedGroup = group.trim();
      if (!trimmedGroup) {
        console.warn('Empty inline math group in explanation');
        return '';
      }
      return `\\(${trimmedGroup}\\)`;
    }
  );

  return processedExplanation;
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

export { 
  config, 
  processMathExpression, 
  processExplanation,
  logMathJaxError
};