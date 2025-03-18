// File: /src/components/quantitative/Layout.tsx
'use client';

import React, { ReactNode } from 'react';
import Head from 'next/head';

interface QuantitativeLayoutProps {
  children: ReactNode;
}

export const QuantitativeLayout: React.FC<QuantitativeLayoutProps> = ({ 
  children 
}) => {
  return (
    <>
      <Head>
        <title>Quantitative Practice - Smart Practice</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </>
  );
};