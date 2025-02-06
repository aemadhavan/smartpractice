'use client';
import React, { useEffect, useRef } from 'react';

// Define a type for an empty object
type EmptyObject = {
  [key: string]: never;
};

// Extend the Window interface to include adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: EmptyObject[];
  }
}

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

  useEffect(() => {
    // Only push the ad if it hasn't been pushed before
    if (typeof window !== 'undefined' && !isAdPushed.current && adRef.current) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({} as EmptyObject);
        isAdPushed.current = true;
      } catch (error) {
        console.error('Error initializing AdSense:', error);
      }
    }

    // Cleanup function
    return () => {
      isAdPushed.current = false;
    };
  }, []);

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