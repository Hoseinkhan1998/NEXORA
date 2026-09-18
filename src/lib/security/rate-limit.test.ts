import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  resetRateLimitStore,
} from "./rate-limit";

describe("Rate Limiting Engine", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe("checkRateLimit", () => {
    it("allows requests within the specified threshold and decrements remaining", () => {
      const key = "user-123";
      const options = { limit: 3, windowMs: 10_000 };

      // Request 1
      const res1 = checkRateLimit(key, options);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);
      expect(res1.limit).toBe(3);

      // Request 2
      const res2 = checkRateLimit(key, options);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      // Request 3
      const res3 = checkRateLimit(key, options);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it("strictly blocks requests that exceed the limit threshold", () => {
      const key = "user-456";
      const options = { limit: 2, windowMs: 10_000 };

      checkRateLimit(key, options); // req 1
      checkRateLimit(key, options); // req 2

      // Request 3 (exceeds limit)
      const blocked = checkRateLimit(key, options);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfter).toBeGreaterThan(0);
      expect(blocked.retryAfter).toBeLessThanOrEqual(10);
    });

    it("isolates rate limit buckets across different identifiers", () => {
      const options = { limit: 1, windowMs: 10_000 };

      // User A uses their single allowance
      const resA1 = checkRateLimit("user-A", options);
      expect(resA1.allowed).toBe(true);

      const resA2 = checkRateLimit("user-A", options);
      expect(resA2.allowed).toBe(false);

      // User B should still be allowed
      const resB1 = checkRateLimit("user-B", options);
      expect(resB1.allowed).toBe(true);
      expect(resB1.remaining).toBe(0);
    });

    it("resets allowance after the sliding window expires", () => {
      const key = "user-expiring";
      const options = { limit: 1, windowMs: 1_000 };

      const res1 = checkRateLimit(key, options);
      expect(res1.allowed).toBe(true);

      const resBlocked = checkRateLimit(key, options);
      expect(resBlocked.allowed).toBe(false);

      // Advance clock past the window
      vi.useFakeTimers();
      vi.advanceTimersByTime(1_500);

      const resAfterExpiry = checkRateLimit(key, options);
      expect(resAfterExpiry.allowed).toBe(true);
      expect(resAfterExpiry.remaining).toBe(0);

      vi.useRealTimers();
    });
  });

  describe("getClientIp", () => {
    it("extracts client IP from x-forwarded-for header", () => {
      const req = new Request("http://localhost", {
        headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("falls back to x-real-ip header", () => {
      const req = new Request("http://localhost", {
        headers: { "x-real-ip": "198.51.100.1" },
      });
      expect(getClientIp(req)).toBe("198.51.100.1");
    });

    it("defaults to 127.0.0.1 when no IP headers exist", () => {
      const req = new Request("http://localhost");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });

  describe("getRateLimitHeaders", () => {
    it("produces standard rate limit headers when allowed", () => {
      const result = {
        allowed: true,
        limit: 15,
        remaining: 14,
        resetAt: Date.now() + 60_000,
        retryAfter: 60,
      };

      const headers = getRateLimitHeaders(result);
      expect(headers["X-RateLimit-Limit"]).toBe("15");
      expect(headers["X-RateLimit-Remaining"]).toBe("14");
      expect(headers["X-RateLimit-Reset"]).toBeDefined();
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("includes Retry-After header when rate limit is exceeded", () => {
      const result = {
        allowed: false,
        limit: 15,
        remaining: 0,
        resetAt: Date.now() + 45_000,
        retryAfter: 45,
      };

      const headers = getRateLimitHeaders(result);
      expect(headers["X-RateLimit-Limit"]).toBe("15");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(headers["Retry-After"]).toBe("45");
    });
  });
});
