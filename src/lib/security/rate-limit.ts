/**
 * In-memory sliding-window rate limiter for server actions and route handlers.
 * Provides protection against brute force, denial of service, and API abuse.
 */

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // timestamp in ms
  retryAfter: number; // seconds until reset, rounded up
}

interface WindowRecord {
  timestamps: number[];
}

const store = new Map<string, WindowRecord>();

// Maximum number of tracked keys to protect against memory exhaustion
const MAX_KEYS = 10_000;

/**
 * Checks whether a request with the given identifier is permitted within the sliding window.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { limit: 20, windowMs: 60_000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = store.get(key);
  if (!record) {
    // If store grows too large, prune expired keys
    if (store.size >= MAX_KEYS) {
      pruneStore(windowStart);
    }
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  const requestCount = record.timestamps.length;
  const allowed = requestCount < options.limit;

  if (allowed) {
    record.timestamps.push(now);
  }

  const remaining = Math.max(0, options.limit - record.timestamps.length);
  const oldestTimestamp = record.timestamps[0] ?? now;
  const resetAt = oldestTimestamp + options.windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));

  return {
    allowed,
    limit: options.limit,
    remaining,
    resetAt,
    retryAfter,
  };
}

/**
 * Extracts a client identifier (IP address) from request headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

/**
 * Generates standard rate limit HTTP headers.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
  };

  if (!result.allowed) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Prunes expired records across the in-memory map.
 */
function pruneStore(cutoffTime: number): void {
  for (const [key, record] of store.entries()) {
    record.timestamps = record.timestamps.filter((ts) => ts > cutoffTime);
    if (record.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Clears all rate limit state (primarily for automated unit test isolation).
 */
export function resetRateLimitStore(): void {
  store.clear();
}
