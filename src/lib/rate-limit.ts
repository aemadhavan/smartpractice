// /lib/rate-limit.ts
export function rateLimit(options: {
    interval: number;
    uniqueTokenPerInterval: number;
  }) {
    const tokenCache = new Map();
    let nextReset = Date.now() + options.interval;
  
    return {
      check: async (limit: number, token: string) => {
        if (Date.now() > nextReset) {
          tokenCache.clear();
          nextReset = Date.now() + options.interval;
        }
  
        const tokenCount = (tokenCache.get(token) || 0) + 1;
  
        if (tokenCount > limit) {
          throw new Error('Rate limit exceeded');
        }
  
        tokenCache.set(token, tokenCount);
        
        return true;
      }
    };
  }