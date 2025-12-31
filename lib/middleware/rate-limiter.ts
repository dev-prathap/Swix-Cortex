interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number = 50, windowMs: number = 60 * 60 * 1000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        
        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    check(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
        const now = Date.now();
        const userLimit = this.limits.get(userId);

        // If no entry or window expired, create new entry
        if (!userLimit || now > userLimit.resetAt) {
            const resetAt = now + this.windowMs;
            this.limits.set(userId, { count: 1, resetAt });
            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetAt
            };
        }

        // Increment count
        userLimit.count++;
        this.limits.set(userId, userLimit);

        // Check if limit exceeded
        if (userLimit.count > this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: userLimit.resetAt
            };
        }

        return {
            allowed: true,
            remaining: this.maxRequests - userLimit.count,
            resetAt: userLimit.resetAt
        };
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [userId, entry] of this.limits.entries()) {
            if (now > entry.resetAt) {
                this.limits.delete(userId);
            }
        }
    }

    // Reset rate limit for a specific user (useful for testing)
    reset(userId: string): void {
        this.limits.delete(userId);
    }

    // Get current stats
    getStats(): { totalUsers: number; activeUsers: number } {
        const now = Date.now();
        const activeUsers = Array.from(this.limits.values())
            .filter(entry => now <= entry.resetAt)
            .length;

        return {
            totalUsers: this.limits.size,
            activeUsers
        };
    }
}

// Singleton instance - 50 requests per hour per user
export const rateLimiter = new RateLimiter(50, 60 * 60 * 1000);

