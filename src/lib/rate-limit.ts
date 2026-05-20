/**
 * Simple in-memory rate limiter for API routes.
 *
 * Tracks request counts per identifier (e.g. IP address) within a
 * sliding time window.  When the limit is exceeded the caller receives
 * a 429 response.
 *
 * NOTE: In-memory tracking is reset on server restart.  For production
 * deployments with multiple instances, switch to a shared store (Redis,
 * KV, etc.).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Periodic cleanup every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  for (const [key, record] of store) {
    if (now > record.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * Check whether `identifier` has exceeded the rate limit.
 *
 * @param identifier  Unique key (usually the client IP).
 * @param maxRequests Maximum number of requests allowed within the window.
 * @param windowMs    Length of the window in milliseconds.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 30,
  windowMs = 60_000,
): RateLimitResult {
  // Periodic cleanup
  if (Date.now() - lastCleanup > CLEANUP_INTERVAL) {
    cleanup();
    lastCleanup = Date.now();
  }

  const now = Date.now();
  const record = store.get(identifier);

  // First request or window expired → start a new window
  if (!record || now > record.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
  }

  // Within the window — check count
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: record.resetAt - now,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInMs: record.resetAt - now,
  };
}
