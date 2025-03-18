//File: /src/app/quantitative/topics/[topicId]/questions/layout.tsx
'use client';


import React from 'react';
import { QuantitativeLayout } from '../../../QuantitativeLayout'

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuantitativeLayout>
      {children}
    </QuantitativeLayout>
  );
}