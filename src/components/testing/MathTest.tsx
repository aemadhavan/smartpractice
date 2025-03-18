import React from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

interface MathTestProps {
  expressions: string[];
}

const MathTest: React.FC<MathTestProps> = ({ expressions }) => {
  return (
    <MathJaxContext>
      <div>
        {expressions.map((expr, index) => (
          <div key={index}>
            <MathJax>
              {`$${expr}$`}
            </MathJax>
          </div>
        ))}
      </div>
    </MathJaxContext>
  );
};

export default MathTest;
