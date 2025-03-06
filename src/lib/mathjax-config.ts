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

  // Fix spacing issues in formulas by ensuring there's a space after each operation
  // This matches common math operators and adds a space after if not already there
  let spacedExpr = escapedExpr
    .replace(/([=×+\-*\/:])([\dA-Za-z])/g, '$1 $2')
    .replace(/([\dA-Za-z])([=×+\-*\/:])/g, '$1 $2');
    
  // Add spaces around ×, =, + when needed
  spacedExpr = spacedExpr
    .replace(/(\d+)×(\d+)/g, '$1 × $2')
    .replace(/(\d+)=(\d+)/g, '$1 = $2')
    .replace(/(\d+)\+(\d+)/g, '$1 + $2')
    .replace(/(\d+)-(\d+)/g, '$1 - $2')
    .replace(/(\d+)\/(\d+)/g, '$1 / $2');
    
  // Check if already properly delimited
  const isDelimited = mathDelimiters.some(delim => 
    spacedExpr.startsWith(delim.start) && spacedExpr.endsWith(delim.end)
  );

  // If not delimited, wrap in inline math
  if (!isDelimited) {
    return `\\(${spacedExpr}\\)`;
  }

  return spacedExpr;
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
    mathSections.push({
      placeholder,
      original: mathMatch[0],
      content: mathMatch[2]
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

export { 
  config, 
  processMathExpression, 
  processExplanation,
  logMathJaxError
};