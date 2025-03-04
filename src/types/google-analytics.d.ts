//types/google-analytics.d.ts

declare global {
  interface Window {
    // Google Analytics definitions with proper typing
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
    
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

// Add more specific types for common gtag commands
interface GtagEvent {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

// EmptyObject type for adsbygoogle
interface EmptyObject {
  [key: string]: never;
}

export {}