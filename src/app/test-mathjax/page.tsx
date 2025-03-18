'use client';

import React from 'react';
import MathRenderer from '@/components/MathRenderer';
import QuizMathRenderer from '@/components/QuizMathRenderer';
import MathText from '@/components/MathText';

export default function TestMathJaxPage() {
  // Test formulas with nested \text commands
  const testFormulas = [
    // The problematic formula from the screenshot
    '$\\text{(Total outfits) = \\text{(Number of t-shirts) \\times \\text{(Number of shorts) = 3 \\times 2 = 6$',
    
    // Properly formatted version
    '$\\text{(Total outfits)} = \\text{(Number of t-shirts)} \\times \\text{(Number of shorts)} = 3 \\times 2 = 6$',
    
    // Other test cases with nested \text
    '$\\text{The formula is: $E = mc^2$}$',
    
    // Formula with fractions
    '$\\frac{\\text{numerator}}{\\text{denominator}}$',
    
    // Complex formula with multiple nested \text
    '$\\text{Area of circle} = \\pi \\times \\text{radius}^2 = \\pi \\times r^2$'
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">MathJax Rendering Test</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Using MathRenderer Component</h2>
        {testFormulas.map((formula, index) => (
          <div key={`math-${index}`} className="mb-4 p-4 border rounded">
            <p className="mb-2 text-sm font-mono bg-gray-100 p-2 rounded">Raw: {formula}</p>
            <div className="p-2 bg-blue-50 rounded">
              <MathRenderer formula={formula} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Using QuizMathRenderer Component</h2>
        {testFormulas.map((formula, index) => (
          <div key={`quiz-${index}`} className="mb-4 p-4 border rounded">
            <p className="mb-2 text-sm font-mono bg-gray-100 p-2 rounded">Raw: {formula}</p>
            <div className="p-2 bg-green-50 rounded">
              <QuizMathRenderer content={formula} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Using MathText Component</h2>
        {testFormulas.map((formula, index) => (
          <div key={`text-${index}`} className="mb-4 p-4 border rounded">
            <p className="mb-2 text-sm font-mono bg-gray-100 p-2 rounded">Raw: {formula}</p>
            <div className="p-2 bg-purple-50 rounded">
              <MathText content={formula} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
