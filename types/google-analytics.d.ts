// types/google-analytics.d.ts
declare global {
    interface Window {
      gtag: (command: string, ...args: any[]) => void;
      dataLayer: any[];
    }
  }
  
  export {}