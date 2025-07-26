/**
 * Validation utilities barrel export
 * Provides centralized access to all validation schemas and utilities
 */
import { z } from 'zod';

// Environment validation
export * from './env';

// Re-export commonly used validation utilities
export { z } from 'zod';

/**
 * Common validation schemas that can be reused across the application
 */
export const commonValidationSchemas = {
  /**
   * Email validation schema
   */
  email: z.string().email('Please enter a valid email address'),

  /**
   * Password validation schema
   */
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^a-zA-Z0-9]/,
      'Password must contain at least one special character'
    ),

  /**
   * URL validation schema
   */
  url: z.string().url('Please enter a valid URL'),

  /**
   * UUID validation schema
   */
  uuid: z.string().uuid('Please enter a valid UUID'),

  /**
   * Phone number validation schema
   */
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),

  /**
   * Positive number validation schema
   */
  positiveNumber: z.number().positive('Must be a positive number'),

  /**
   * Non-empty string validation schema
   */
  nonEmptyString: z.string().min(1, 'This field is required'),

  /**
   * Slug validation schema
   */
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Must be a valid slug (lowercase, numbers, hyphens)'
    ),
} as const;

/**
 * Validation error formatter
 */
export function formatValidationError(error: z.ZodError): string {
  return error.errors
    .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}

/**
 * Safe validation function that returns a result object
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}
