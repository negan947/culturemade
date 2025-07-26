import { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// In production, you'd want to use Redis or similar
const attempts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'anonymous';
  const now = Date.now();
  const key = `${ip}:${request.nextUrl.pathname}`;

  // Clean up old entries
  const current = attempts.get(key);
  if (current && now > current.resetTime) {
    attempts.delete(key);
  }

  // Get or create entry
  const entry = attempts.get(key) || { count: 0, resetTime: now + windowMs };
  entry.count++;
  attempts.set(key, entry);

  // Check if limit exceeded
  if (entry.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getRateLimitHeaders(result: ReturnType<typeof rateLimit>) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}
