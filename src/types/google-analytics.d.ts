//types/google-analytics.d.ts

declare global {
  interface Window {
    // Google Analytics definitions with proper typing
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
    
    // Google AdSense definitions with improved types
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

// Consent mode types
interface ConsentMode {
  'ad_storage'?: 'granted' | 'denied';
  'analytics_storage'?: 'granted' | 'denied';
  'personalization_storage'?: 'granted' | 'denied';
  'functionality_storage'?: 'granted' | 'denied';
  'security_storage'?: 'granted' | 'denied';
}

// Google AdSense consent interface - for use with window.adsbygoogle.push()
interface GoogleConsentPayload {
  'google_consent': ConsentMode;
}

// AdSense command shapes
type AdSenseCommand = GoogleConsentPayload | Record<string, unknown>;

// Optional: Google Analytics config interface for type safety
interface GtagConfig {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  send_page_view?: boolean;
}

// Add more specific types for common gtag commands
interface GtagEvent {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

export {}