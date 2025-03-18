//File: /src/app/quantitative/topics/layout.tsx
'use client';

import { QuantitativeLayout } from './QuantitativeLayout';

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuantitativeLayout>
      {children}
    </QuantitativeLayout>
  );
}