//File: /src/components/MathJaxProvider.tsx
'use client';

import React from 'react';
import { UnifiedMathLayout } from './math/UnifiedMathLayout';

interface MathJaxProviderProps {
  children: React.ReactNode;
}

/**
 * MathJaxProvider component for rendering LaTeX formulas
 * Now uses the UnifiedMathLayout for consistent rendering across the app
 */
const MathJaxProvider: React.FC<MathJaxProviderProps> = ({ children }) => {
  return (
    <UnifiedMathLayout>
      {children}
    </UnifiedMathLayout>
  );
};

export default MathJaxProvider;