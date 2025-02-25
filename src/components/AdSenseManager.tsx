// src/components/AdSenseManager.tsx

'use client';

import React, { useEffect, useState } from 'react';

interface AdSenseManagerProps {
  children: React.ReactNode;
}

const AdSenseManager: React.FC<AdSenseManagerProps> = ({ children }) => {
  const [shouldShowAds, setShouldShowAds] = useState(false);
  
  useEffect(() => {
    // Function to check if there's enough content on the page
    const checkForContent = () => {
      // Look for meaningful content elements on the page
      const contentElements = document.querySelectorAll('article, .prose, section p, .content-area');
      
      // Calculate total text content length
      const totalTextContent = Array.from(contentElements)
        .reduce((acc, el) => acc + (el.textContent?.trim().length || 0), 0);
      
      // Check if we have enough content to display ads (min 300 characters)
      const hasEnoughContent = totalTextContent > 300;
      
      // Check if we're on a "construction" or non-content page
      const isUnderConstruction = document.title.toLowerCase().includes('coming soon') || 
                                  document.querySelector('.under-construction');
                                  
      // Check if we're on an alert/navigation page
      const isAlertPage = document.querySelector('.alert-page, .notification-area, .modal-open');
      
      // Only show ads if we have enough content and aren't on a restricted page type
      setShouldShowAds(hasEnoughContent && !isUnderConstruction && !isAlertPage);
    };
    
    // Check when the component mounts
    checkForContent();
    
    // Also check whenever the DOM content might change
    const observer = new MutationObserver(checkForContent);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: true 
    });
    
    // Check for cookie consent status
    const handleStorageChange = () => {
      const cookieConsent = localStorage.getItem('cookieConsent');
      if (cookieConsent) {
        const consent = JSON.parse(cookieConsent);
        // Only show ads if advertising consent is granted
        if (!consent.advertising) {
          setShouldShowAds(false);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange(); // Check initial state
    
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Provide ad display status to any components that need it
  return (
    <div className={`ad-manager ${shouldShowAds ? 'ads-enabled' : 'ads-disabled'}`}>
      {children}
    </div>
  );
};

export default AdSenseManager;