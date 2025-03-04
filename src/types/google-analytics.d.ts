//types/google-analytics.d.ts

declare global {
  interface Window {
    // Google Analytics definitions
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
    
    // Google AdSense definitions
    adsbygoogle?: EmptyObject[];
  }
}

// Optional: Google Analytics config interface for type safety
interface GtagConfig {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  send_page_view?: boolean;
}

export {}