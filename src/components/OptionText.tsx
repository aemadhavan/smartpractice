// File: /src/components/OptionText.tsx
import React, { ReactNode } from 'react';
import { MathJax } from 'better-react-mathjax';

interface OptionTextProps {
  children: ReactNode;
  className?: string;
}

const OptionText = ({ children, className = '' }: OptionTextProps) => {
  // Don't render anything if children is null or undefined
  if (children === null || children === undefined) {
    return null;
  }
  
  return (
    <MathJax 
      hideUntilTypeset="first" 
      dynamic={true} 
      className={className}
    >
      {children}
    </MathJax>
  );
};

export default OptionText;