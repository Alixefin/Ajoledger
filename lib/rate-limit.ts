/**
 * Client-side rate limiting utility
 * Prevents abuse by limiting the number of requests in a time window
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
}

/**
 * Check if an action is rate limited
 * @param key - Unique identifier for the action (e.g., 'login', 'add-member')
 * @param options - Rate limit configuration
 * @returns Object with isLimited boolean and retryAfter in seconds
 */
export function checkRateLimit(
  key: string,
  options: Partial<RateLimitOptions> = {}
): { isLimited: boolean; retryAfter: number } {
  const { maxRequests, windowMs } = { ...DEFAULT_OPTIONS, ...options }
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key)
  }

  const currentEntry = rateLimitStore.get(key)

  if (!currentEntry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { isLimited: false, retryAfter: 0 }
  }

  if (currentEntry.count >= maxRequests) {
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000)
    return { isLimited: true, retryAfter }
  }

  // Increment count
  currentEntry.count++
  rateLimitStore.set(key, currentEntry)
  return { isLimited: false, retryAfter: 0 }
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Rate limit presets for common actions
 */
export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 attempts per minute
  form: { maxRequests: 15, windowMs: 60000 }, // 15 submissions per minute
  api: { maxRequests: 30, windowMs: 60000 }, // 30 calls per minute
  bulk: { maxRequests: 5, windowMs: 120000 }, // 5 bulk operations per 2 minutes
} as const
