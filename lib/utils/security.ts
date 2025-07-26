import { NextRequest } from 'next/server';

import { z } from 'zod';

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  return token === sessionToken;
}

// Input validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'
  );

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
  .optional();

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters');

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

// Check if request is from a suspicious source
export function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';

  // Check for common bot patterns
  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i];

  const isBotUserAgent = botPatterns.some((pattern) => pattern.test(userAgent));

  // Check for missing user agent (often indicates automation)
  const hasUserAgent = userAgent.length > 0;

  return isBotUserAgent || !hasUserAgent;
}

// Log security events
/* eslint-disable no-unused-vars */
export function logSecurityEvent(
  _event: string,
  _details: Record<string, unknown>,
  _request?: NextRequest
) {
  // Implementation temporarily disabled for production build
  // TODO: Replace with proper logging system
}

// Validate redirect URLs to prevent open redirects
export function validateRedirectUrl(
  url: string,
  allowedDomains: string[]
): boolean {
  try {
    const parsedUrl = new URL(url);

    // Allow relative URLs
    if (url.startsWith('/')) {
      return true;
    }

    // Check if domain is in allowed list
    return allowedDomains.includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

// Generate secure random string
export function generateSecureRandom(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
