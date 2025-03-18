//File: /src/app/maths/topics/[topicId]/questions/layout.tsx
'use client';

import React from 'react';
import { UnifiedMathLayout } from '@/components/math/UnifiedMathLayout';

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedMathLayout>
      {children}
    </UnifiedMathLayout>
  );
}