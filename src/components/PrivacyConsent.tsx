//src/components/PrivacyConsent.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  personalization: boolean;
}


const PrivacyConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [consents, setConsents] = useState<ConsentState>({
    necessary: true, // Always required
    analytics: false,
    advertising: false,
    personalization: false
  });

  useEffect(() => {
    // Check if consent was previously given
    const savedConsent = localStorage.getItem('cookieConsent');
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      setConsents(JSON.parse(savedConsent));
    }

    // Listen for storage events to open privacy settings
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'openPrivacySettings' && e.newValue === 'true') {
        setShowPreferences(true);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const handleAcceptAll = () => {
    const allConsents = {
      necessary: true,
      analytics: true,
      advertising: true,
      personalization: true
    };
    saveConsents(allConsents);
  };

  const handleRejectAll = () => {
    const minimalConsents = {
      necessary: true,
      analytics: false,
      advertising: false,
      personalization: false
    };
    saveConsents(minimalConsents);
  };

  const handleSavePreferences = () => {
    saveConsents(consents);
  };

  const saveConsents = (newConsents: ConsentState) => {
    localStorage.setItem('cookieConsent', JSON.stringify(newConsents));
    setConsents(newConsents);
    setShowBanner(false);
    setShowPreferences(false);
    
    // Dispatch a storage event so other components can react to the consent change
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cookieConsent',
      newValue: JSON.stringify(newConsents)
    }));
    
    // Update Google AdSense consent
    if (window.adsbygoogle) {
      window.adsbygoogle.push({
        'google_consent': {
          'ad_storage': newConsents.advertising ? 'granted' : 'denied',
          'analytics_storage': newConsents.analytics ? 'granted' : 'denied',
          'personalization_storage': newConsents.personalization ? 'granted' : 'denied',
          'functionality_storage': 'granted',
          'security_storage': 'granted',
        }
      });
    }

    // Update Google Analytics consent if needed
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': newConsents.analytics ? 'granted' : 'denied',
        'ad_storage': newConsents.advertising ? 'granted' : 'denied',
        'personalization_storage': newConsents.personalization ? 'granted' : 'denied'
      });
    }
  };

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-1">Cookie Consent</h3>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your browsing experience, serve personalized ads, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies as described in our{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Reject All
              </button>
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Customize
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Cookie Preferences</h2>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Necessary Cookies</h4>
                      <p className="text-sm text-gray-500">Required for the website to function properly</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Analytics Cookies</h4>
                      <p className="text-sm text-gray-500">Help us improve our website by collecting anonymous usage data</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={consents.analytics}
                        onChange={(e) => setConsents({ ...consents, analytics: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Advertising Cookies</h4>
                      <p className="text-sm text-gray-500">Used to show you relevant advertisements</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={consents.advertising}
                        onChange={(e) => setConsents({ ...consents, advertising: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Personalization Cookies</h4>
                      <p className="text-sm text-gray-500">Help provide a more personalized experience</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={consents.personalization}
                        onChange={(e) => setConsents({ ...consents, personalization: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy button that's always visible */}
      <button
        onClick={() => setShowPreferences(true)}
        className="fixed bottom-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm z-40"
      >
        Privacy Settings
      </button>
    </>
  );
};

export default PrivacyConsent;