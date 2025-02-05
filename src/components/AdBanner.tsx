'use client';
import React, { useEffect } from 'react';

// Extend the Window interface to include adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: {}[]; // Array of objects
  }
}

type AdBannerProps = {
  adSense: string;
  dataadslot: string;
  dataadformat: string;
  datafullwidthresponsive: string | boolean; // Allow both string and boolean
};

const AdBanner: React.FC<AdBannerProps> = ({
  adSense,
  dataadslot,
  dataadformat,
  datafullwidthresponsive,
}) => {
  useEffect(() => {
    // Safely initialize adsbygoogle
    if (typeof window !== 'undefined') {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({}); // Push an empty object
    }
  }, []);

  return (
    <div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adSense}
        data-ad-slot={dataadslot}
        data-ad-format={dataadformat}
        data-full-width-responsive={String(datafullwidthresponsive)} // Convert to string
      ></ins>
    </div>
  );
};

export default AdBanner;