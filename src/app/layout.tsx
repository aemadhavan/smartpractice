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

// export const metadata: Metadata = {
//   title: "Smart Practice",
//   description: "Smart Practice app",
// };

// Add these Open Graph tags to your layout.tsx file within the metadata object

export const metadata: Metadata = {
  title: "Smart Practise | AI-Powered Selective School Exam Preparation",
  description: "Smart Practise offers personalized AI-powered learning paths for selective entry high school exams with real-time progress tracking and adaptive feedback.",
  openGraph: {
    type: "website",
    url: "https://smartpractise.com",
    title: "Smart Practise | AI-Powered Selective School Exam Preparation",
    description: "Personalized learning paths for selective entry exams with real-time progress tracking and adaptive feedback.",
    siteName: "Smart Practise",
    images: [
      {
        url: "/sp-logo.png", // Replace with your actual image path
        width: 1200,
        height: 630,
        alt: "Smart Practise - Selective School Exam Preparation"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Practise | Selective School Exam Prep",
    description: "AI-powered practice for mathematics, vocabulary & quantitative reasoning tests.",
    images: ["/sp-logo.png"], // Replace with your actual image path
    creator: "@smartpractiseai" // Replace with your Twitter handle if applicable
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adSenseId = "pub-2425712839519303";

  
  return (
    <html lang="en" suppressHydrationWarning>
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
                    find: [10, function (doc) {
                      for (const math of doc.math) {
                        if (math.state() >= 1) {
                          math.data.skipReprocess = true;
                        }
                      }
                    }],
                    reprocess: [1000, function (doc) {
                      for (const math of doc.math) {
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
                  ready: function() {
                    if (typeof window !== 'undefined') {
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
        
        {process.env.NODE_ENV === 'production' && (
          <>          <Script 
            id="ahrefs-analytics"
            src="https://analytics.ahrefs.com/analytics.js"
            data-key="prC1gJHHzvNKUadRBmmK+A"
            strategy="afterInteractive"
          />

            <Script id="ahrefs-analytics-alt" strategy="afterInteractive">
          {`
            var ahrefs_analytics_script = document.createElement("script");
            ahrefs_analytics_script.async = true;
            ahrefs_analytics_script.src = "https://analytics.ahrefs.com/analytics.js";
            ahrefs_analytics_script.setAttribute("data-key", "prC1gJHHzvNKUadRBmmK+A");
            document.getElementsByTagName("head")[0].appendChild(ahrefs_analytics_script);
          `}
          </Script>
                  {/* Microsoft Clarity analytics */}
          <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "qr4f8twv1i");
            `,
          }}
        />
          </>


        )}
        
      

        
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Move ClerkProvider inside the body */}
        <ClerkProvider>
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
        </ClerkProvider>
      </body>
    </html>
  );
}