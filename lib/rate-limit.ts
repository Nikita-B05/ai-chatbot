import "server-only";

import { createClient } from "redis";

type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp in seconds
};

class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  async checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new window
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        success: true,
        remaining: limit - 1,
        reset: Math.floor(resetAt / 1000),
      };
    }

    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        reset: Math.floor(entry.resetAt / 1000),
      };
    }

    // Increment count
    entry.count += 1;
    return {
      success: true,
      remaining: limit - entry.count,
      reset: Math.floor(entry.resetAt / 1000),
    };
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }
}

let redisClient: ReturnType<typeof createClient> | null = null;
let inMemoryLimiter: InMemoryRateLimiter | null = null;

async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    console.warn("Failed to connect to Redis for rate limiting:", error);
    return null;
  }
}

async function getInMemoryLimiter() {
  if (!inMemoryLimiter) {
    inMemoryLimiter = new InMemoryRateLimiter();
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      inMemoryLimiter?.cleanup();
    }, 5 * 60 * 1000);
  }
  return inMemoryLimiter;
}

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = await getRedisClient();

  if (redis) {
    // Use Redis with sliding window
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove old entries outside the window
      await redis.zRemRangeByScore(key, 0, windowStart);

      // Count current entries in the window
      const count = await redis.zCard(key);

      if (count >= limit) {
        // Get the oldest entry to determine reset time
        const oldest = await redis.zRange(key, 0, 0, { REV: false });
        const oldestTimestamp = oldest[0]
          ? Number.parseInt(oldest[0], 10)
          : now;
        const reset = Math.floor((oldestTimestamp + windowMs) / 1000);

        return {
          success: false,
          remaining: 0,
          reset,
        };
      }

      // Add current request
      await redis.zAdd(key, {
        score: now,
        value: now.toString(),
      });
      // Set expiration to slightly longer than window
      await redis.expire(key, Math.ceil(windowMs / 1000) + 10);

      return {
        success: true,
        remaining: limit - count - 1,
        reset: Math.floor((now + windowMs) / 1000),
      };
    } catch (error) {
      console.warn("Redis rate limit error, falling back to in-memory:", error);
      // Fall through to in-memory limiter
    }
  }

  // Fallback to in-memory limiter
  const limiter = await getInMemoryLimiter();
  return limiter.checkLimit(identifier, limit, windowMs);
}

/**
 * Check rate limit for a user (30 requests per minute)
 */
export async function checkChatRateLimit(
  userId: string
): Promise<RateLimitResult> {
  return checkRateLimit(`chat:${userId}`, 30, 60 * 1000); // 30 requests per 60 seconds
}

