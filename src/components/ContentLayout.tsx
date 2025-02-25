// src/components/ContentLayout.tsx

'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import ResponsiveAd from './ResponsiveAd';

interface ContentLayoutProps {
  children: ReactNode;
  title: string;
  showAds?: boolean;
}

const ContentLayout: React.FC<ContentLayoutProps> = ({ 
  children, 
  title,
  showAds = true
}) => {
  const [canShowAds, setCanShowAds] = useState(false);
  
  useEffect(() => {
    // Check if we have advertising consent
    const checkConsentAndContent = () => {
      try {
        // Check consent
        const consentData = localStorage.getItem('cookieConsent');
        if (!consentData) return false;
        
        const consent = JSON.parse(consentData);
        if (!consent.advertising) return false;
        
        // Check if we have sufficient content (wait for it to render)
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return false;
        
        const contentLength = contentArea.textContent?.length || 0;
        return contentLength > 500; // Minimum content length
        
      } catch (e) {
        console.error('Error checking conditions:', e);
        return false;
      }
    };
    
    // Initial check
    const initialCheck = setTimeout(() => {
      setCanShowAds(checkConsentAndContent());
    }, 1000); // Short delay to allow content to render
    
    // Monitor for DOM changes that could affect content length
    const observer = new MutationObserver(() => {
      setCanShowAds(checkConsentAndContent());
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: true 
    });
    
    return () => {
      clearTimeout(initialCheck);
      observer.disconnect();
    };
  }, []);
  
  return (
    <div className="content-layout">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      
      {/* Primary content area - must come before ads */}
      <div className="content-area mb-8">
        {children}
      </div>
      
      {/* Only show ads if we have content and consent */}
      {showAds && canShowAds && (
        <div className="ads-section mt-8">
          <ResponsiveAd 
            adSlot="1234567890" 
            format="rectangle" 
            className="my-6"
          />
        </div>
      )}
    </div>
  );
};

export default ContentLayout;