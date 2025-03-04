// File: src/types/better-react-mathjax.d.ts

import 'better-react-mathjax';

// Augment the existing module
declare module 'better-react-mathjax' {
  // Only add the missing property
  export interface MathJaxProps {
    typesetting?: boolean;
  }
}