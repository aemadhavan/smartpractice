//File: /src/components/AdBanner.tsx

'use client';
import React, { useEffect, useRef, useState } from 'react';

// We don't need to redeclare window.adsbygoogle since it's already in google-analytics.d.ts
// Removing the conflicting declaration and unused EmptyObject type

type AdBannerProps = {
  adSense: string;
  dataadslot: string;
  dataadformat: string;
  datafullwidthresponsive: string | boolean;
};

const AdBanner: React.FC<AdBannerProps> = ({
  adSense,
  dataadslot,
  dataadformat,
  datafullwidthresponsive,
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdPushed = useRef(false);
  const [hasConsent, setHasConsent] = useState<boolean>(false);

  // Check if user has given consent for advertising
  useEffect(() => {
    const checkConsentStatus = () => {
      try {
        const consentData = localStorage.getItem('cookieConsent');
        if (!consentData) {
          setHasConsent(false);
          return false;
        }
        
        const { advertising } = JSON.parse(consentData);
        setHasConsent(advertising === true);
        return advertising === true;
      } catch (error) {
        console.error('Error checking consent:', error);
        setHasConsent(false);
        return false;
      }
    };

    // Check initial consent
    checkConsentStatus();

    // Listen for changes to consent (storage event)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cookieConsent') {
        checkConsentStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Initialize the ad if consent is given
  useEffect(() => {
    // Only push the ad if it hasn't been pushed before and has consent
    if (typeof window !== 'undefined' && hasConsent && !isAdPushed.current && adRef.current) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        isAdPushed.current = true;
      } catch (error) {
        console.error('Error initializing AdSense:', error);
      }
    }

    // Cleanup function
    return () => {
      isAdPushed.current = false;
    };
  }, [hasConsent]);

  // If no consent, show placeholder
  if (!hasConsent) {
    return (
      <div 
        className="text-center p-4 border border-dashed border-gray-300"
        style={{ 
          backgroundColor: '#f9fafb', 
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p className="text-gray-500 text-sm">
          Ads are disabled. Enable advertising cookies in the privacy settings to see ads.
        </p>
      </div>
    );
  }

  return (
    <div ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adSense}
        data-ad-slot={dataadslot}
        data-ad-format={dataadformat}
        data-full-width-responsive={String(datafullwidthresponsive)}
      ></ins>
    </div>
  );
};

export default AdBanner;