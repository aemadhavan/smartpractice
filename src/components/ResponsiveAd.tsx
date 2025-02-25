// src/components/ResponsiveAd.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ResponsiveAdProps {
  adSlot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

const ResponsiveAd: React.FC<ResponsiveAdProps> = ({ 
  adSlot, 
  format = 'auto',
  className = '' 
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasEnoughContent, setHasEnoughContent] = useState(false);
  
  useEffect(() => {
    // Check if we're in a context with enough content
    const checkContentAmount = () => {
      const container = adRef.current?.closest('article') || document.body;
      const textContent = container.textContent || '';
      
      // Require at least 1000 characters of content for ads
      setHasEnoughContent(textContent.length > 1000);
    };
    
    // Check if the ad is visible in the viewport
    const checkVisibility = () => {
      if (!adRef.current) return;
      
      const rect = adRef.current.getBoundingClientRect();
      const isInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      
      setIsVisible(isInViewport);
    };
    
    // Check for consent
    const checkConsent = () => {
      try {
        const consentData = localStorage.getItem('cookieConsent');
        if (!consentData) return false;
        
        const consent = JSON.parse(consentData);
        return consent.advertising === true;
      } catch (e) {
        console.error('Error checking consent:', e);
        return false;
      }
    };
    
    // Initialize ad when conditions are met
    const initializeAd = () => {
      if (hasEnoughContent && isVisible && checkConsent() && window.adsbygoogle) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    };
    
    // Set up checks
    checkContentAmount();
    checkVisibility();
    
    // Set up observers and listeners
    const resizeObserver = new ResizeObserver(checkVisibility);
    if (adRef.current) {
      resizeObserver.observe(adRef.current);
    }
    
    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);
    window.addEventListener('storage', initializeAd); // Re-check when consent changes
    
    // Initialize ad
    initializeAd();
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
      window.removeEventListener('storage', initializeAd);
    };
  }, [hasEnoughContent, isVisible]);
  
  // Don't render if there's not enough content
  if (!hasEnoughContent) {
    return null;
  }
  
  return (
    <div ref={adRef} className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-YOUR_CLIENT_ID" // Replace with your client ID
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <small className="text-xs text-gray-400 text-center block mt-1">Advertisement</small>
    </div>
  );
};

export default ResponsiveAd;