//File: /src/app/maths/topics/layout.tsx
'use client';

import { UnifiedMathLayout } from '@/components/math/UnifiedMathLayout';

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedMathLayout>
      {children}
    </UnifiedMathLayout>
  );
}