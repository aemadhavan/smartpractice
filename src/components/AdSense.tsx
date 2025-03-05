'use client';

import Script from "next/script";
import React from "react";

type AdSenseTypes = {
    adSense: string;
};

// Define consent types for better type safety
type ConsentMode = {
    'ad_storage': 'granted' | 'denied';
    'analytics_storage': 'granted' | 'denied';
    'personalization_storage': 'granted' | 'denied';
    'functionality_storage': 'granted' | 'denied';
    'security_storage': 'granted' | 'denied';
};

const AdSense = ({ adSense }: AdSenseTypes) => {
    // Set initial consent state for Google AdSense
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                // Define dataLayer if not already defined
                window.dataLayer = window.dataLayer || [];
                
                // Use window.gtag directly with proper typing
                if (!window.gtag) {
                    // Fixed: Push arguments as a single object, not as an array
                    window.gtag = function(command: string, ...args: unknown[]) {
                        // Push arguments properly according to gtag/dataLayer expectations
                        window.dataLayer.push({
                            'event': command,
                            ...args.length > 0 ? args[0] as Record<string, unknown> : {}
                        });
                    };
                }
                
                // Set default consent state to denied for ads
                window.gtag('consent', 'default', {
                    'ad_storage': 'denied',
                    'analytics_storage': 'denied',
                    'personalization_storage': 'denied',
                    'functionality_storage': 'granted',
                    'security_storage': 'granted',
                } as ConsentMode);
                
                // Check if consent has been given previously
                const checkConsent = () => {
                    try {
                        const consentData = localStorage.getItem('cookieConsent');
                        if (consentData) {
                            const { advertising, analytics, personalization } = JSON.parse(consentData);
                            
                            // Update consent state based on stored preferences
                            window.gtag('consent', 'update', {
                                'ad_storage': advertising ? 'granted' : 'denied',
                                'analytics_storage': analytics ? 'granted' : 'denied',
                                'personalization_storage': personalization ? 'granted' : 'denied',
                            } as Partial<ConsentMode>);
                        }
                    } catch (error) {
                        console.error('Error checking consent:', error);
                    }
                };
                
                // Check consent on initial load
                checkConsent();
            } catch (error) {
                console.error('Error initializing consent management:', error);
            }
        }
    }, []);

    return (
        <Script async 
            strategy="lazyOnload"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSense}`}
            crossOrigin="anonymous"
        />
    );
};

export default AdSense;