// src/scripts/contentChecker.js

// This script should run before AdSense loads
(function() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
      checkPageContent();
    });
    
    // Also run on window load to catch dynamically loaded content
    window.addEventListener('load', function() {
      checkPageContent();
    });
    
    function checkPageContent() {
      // Get all possible content areas
      const contentSelectors = [
        'article', '.prose', '.content-area', 'main p', 
        '.page-content', 'section', '#main-content'
      ];
      
      const contentElements = document.querySelectorAll(contentSelectors.join(', '));
      
      // Calculate total text length from all content elements
      let totalTextLength = 0;
      contentElements.forEach(el => {
        totalTextLength += (el.textContent || '').trim().length;
      });
      
      // Set a threshold for "enough content"
      const MIN_CONTENT_LENGTH = 500;
      
      // Check if we're on a page type that shouldn't show ads
      const isAlertPage = !!document.querySelector('.alert, .notification');
      const isUnderConstruction = document.title.includes('Coming Soon') || 
                                  document.title.includes('Under Construction');
      const isModalOpen = !!document.querySelector('.modal-open, .dialog-open');
      const isConsentBannerOpen = !!document.querySelector('.privacy-banner, .cookie-banner');
      
      // Determine if we should show ads
      const shouldShowAds = (
        totalTextLength >= MIN_CONTENT_LENGTH && 
        !isAlertPage && 
        !isUnderConstruction && 
        !isModalOpen &&
        !isConsentBannerOpen
      );
      
      // Apply appropriate class to body
      if (shouldShowAds) {
        document.body.classList.remove('no-content');
        document.body.classList.add('has-content');
      } else {
        document.body.classList.add('no-content');
        document.body.classList.remove('has-content');
      }
      
      // Debug info
      console.log('Content check:', {
        totalTextLength,
        contentElements: contentElements.length,
        shouldShowAds,
        isAlertPage,
        isUnderConstruction,
        isModalOpen,
        isConsentBannerOpen
      });
    }
  })();