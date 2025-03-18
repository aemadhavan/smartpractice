//File: /src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GoogleAnalytics from '@/components/google-analytics';
import { Suspense } from 'react';
import AdSense from '@/components/AdSense';
import PrivacyConsent from '@/components/PrivacyConsent';
import Script from 'next/script';

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
          
          {/* Google Tag Manager script for consent management */}
          <Script
            id="consent-management-init"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  'ad_storage': 'denied',
                  'analytics_storage': 'denied',
                  'personalization_storage': 'denied',
                  'functionality_storage': 'granted',
                  'security_storage': 'granted',
                });
              `,
            }}
          />
          
          {/* MathJax configuration - load before MathJax itself */}
          <Script
            id="mathjax-config"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.MathJax = {
                  tex: {
                    inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                    displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                    processEscapes: true,
                    processEnvironments: true,
                    packages: {'[+]': ['ams', 'noerrors']}
                  },
                  options: {
                    enableMenu: false,
                    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                    processHtmlClass: 'tex2jax_process',
                    renderActions: {
                      // Add a custom action to prevent re-processing of already processed math
                      find: [10, function (doc) {
                        for (const math of doc.math) {
                          if (math.state() >= 1) {
                            math.data.skipReprocess = true;
                          }
                        }
                      }],
                      reprocess: [1000, function (doc) {
                        for (const math of doc.math) {
                          // Skip math that has already been processed
                          if (math.data && math.data.skipReprocess) {
                            delete math.data.skipReprocess;
                            math.state(1);
                          }
                        }
                      }]
                    }
                  },
                  startup: {
                    typeset: true,
                    // Add a ready function to ensure MathJax is fully initialized
                    ready: function() {
                      console.log('MathJax is ready');
                      MathJax.startup.defaultReady();
                      
                      // Create a global flag to indicate MathJax is ready
                      window.mathJaxReady = true;
                      
                      // Create a global function to safely typeset content
                      window.safeTypesetMathJax = function(elements) {
                        if (!window.MathJax || !window.MathJax.typesetPromise) {
                          console.warn('MathJax is not fully loaded');
                          return Promise.resolve();
                        }
                        
                        // Use a timeout to ensure the DOM is updated
                        return new Promise((resolve) => {
                          setTimeout(() => {
                            MathJax.typesetPromise(elements)
                              .then(resolve)
                              .catch((err) => {
                                console.error('MathJax typesetting failed:', err);
                                resolve();
                              });
                          }, 50);
                        });
                      };
                    }
                  }
                };
              `,
            }}
          />
          
          {/* MathJax CDN */}
          <Script
            id="mathjax-cdn"
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
            strategy="afterInteractive"
          />
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
          
          {/* Add Privacy Consent Component */}
          <PrivacyConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}
