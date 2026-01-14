// Simple in-memory rate limiter for chatbot searches
// This prevents users from spamming search requests

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests.entries()) {
        if (now > entry.resetAt) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Check if a user can make a request
   * @param identifier - User ID or IP address
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with success status and remaining requests
   */
  async limit(
    identifier: string,
    limit: number = 10, // 10 requests
    windowMs: number = 60000 // per minute
  ): Promise<{ success: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No entry or expired - create new
    if (!entry || now > entry.resetAt) {
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        success: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    this.requests.set(identifier, entry);

    return {
      success: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Get current stats for an identifier
   */
  getStats(identifier: string): { count: number; resetAt: number } | null {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return null;
    }
    return { count: entry.count, resetAt: entry.resetAt };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Export singleton instance
export const rateLimiter = new InMemoryRateLimiter();

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  CHATBOT_SEARCH: {
    limit: 20, // 20 searches
    windowMs: 60000, // per minute (1 min)
  },
  CHATBOT_COMMAND: {
    limit: 30, // 30 commands
    windowMs: 60000, // per minute
  },
  CHATBOT_FAQ: {
    limit: 30, // 30 FAQ queries
    windowMs: 60000, // per minute
  },
} as const;
