import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GoogleAnalytics from '@/components/google-analytics';
import { Suspense } from 'react';
import AdSense from '@/components/AdSense';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Practice",
  description: "Smart Practice app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adSenseId = "pub-2425712839519303";
  
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <AdSense adSense={adSenseId} />
          <meta name="google-adsense-account" content={`ca-${adSenseId}`} />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Suspense fallback={null}>
            {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
              <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
            )}
          </Suspense>
          <Header />
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}