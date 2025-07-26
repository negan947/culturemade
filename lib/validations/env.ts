import { z } from 'zod';

/**
 * Environment variable validation schemas
 * This file validates all environment variables used in the application
 * and provides type-safe access to them.
 */

/**
 * Base environment validation schema
 * Validates Node.js environment and common variables
 */
const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Application environment'),

  NEXT_PUBLIC_APP_URL: z.string().url().describe('Public application URL'),
});

/**
 * Supabase environment validation schema
 * Validates all Supabase-related environment variables
 */
const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().describe('Supabase project URL'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1)
    .describe('Supabase anonymous key for client-side operations'),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1)
    .describe('Supabase service role key for server-side operations'),
});

/**
 * Stripe environment validation schema
 * Validates all Stripe-related environment variables
 */
const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z
    .string()
    .min(1)
    .startsWith('sk_')
    .describe('Stripe secret key for server-side operations'),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1)
    .startsWith('pk_')
    .describe('Stripe publishable key for client-side operations'),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1)
    .optional()
    .describe('Stripe webhook secret for webhook verification'),

  APPLE_PAY_MERCHANT_ID: z
    .string()
    .optional()
    .describe('Apple Pay merchant identifier'),
});

/**
 * Email service environment validation schema
 * Validates email service configuration
 */
const emailEnvSchema = z.object({
  RESEND_API_KEY: z
    .string()
    .min(1)
    .startsWith('re_')
    .describe('Resend API key for email services'),
});

/**
 * Optional development environment validation schema
 * Validates development-specific environment variables
 */
const developmentEnvSchema = z.object({
  SITE_LOCKED: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true')
    .describe('Whether the site is locked for development'),

  BYPASS_AUTH: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true')
    .describe('Whether to bypass authentication in development'),

  DEBUG: z.string().optional().describe('Debug mode configuration'),

  SKIP_ENV_VALIDATION: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true')
    .describe('Whether to skip environment validation'),
});

/**
 * Error monitoring environment validation schema
 * Validates error monitoring service configuration
 */
const monitoringEnvSchema = z.object({
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .describe('Sentry DSN for error tracking'),

  SENTRY_AUTH_TOKEN: z
    .string()
    .optional()
    .describe('Sentry authentication token'),

  SENTRY_ORG: z.string().optional().describe('Sentry organization slug'),

  SENTRY_PROJECT: z.string().optional().describe('Sentry project slug'),

  VERCEL_ANALYTICS_ID: z.string().optional().describe('Vercel Analytics ID'),
});

/**
 * Complete environment validation schema
 * Combines all environment validation schemas
 */
export const envSchema = baseEnvSchema
  .merge(supabaseEnvSchema)
  .merge(stripeEnvSchema)
  .merge(emailEnvSchema)
  .merge(developmentEnvSchema)
  .merge(monitoringEnvSchema);

/**
 * Type for validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Client-side environment validation schema
 * Only includes environment variables that are safe to expose to the client
 */
export const clientEnvSchema = z.object({
  NODE_ENV: baseEnvSchema.shape.NODE_ENV,
  NEXT_PUBLIC_APP_URL: baseEnvSchema.shape.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: supabaseEnvSchema.shape.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    supabaseEnvSchema.shape.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    stripeEnvSchema.shape.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});

/**
 * Type for validated client-side environment variables
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Server-side environment validation schema
 * Includes all environment variables, including sensitive ones
 */
export const serverEnvSchema = envSchema;

/**
 * Type for validated server-side environment variables
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Environment validation configuration
 */
export const envConfig = {
  /**
   * Whether to skip environment validation
   * Useful for build processes or when environment variables are not available
   */
  skipValidation: process.env['SKIP_ENV_VALIDATION'] === 'true',

  /**
   * Whether to throw errors on validation failure
   * Set to false for graceful degradation
   */
  throwOnError: process.env.NODE_ENV === 'production',

  /**
   * Whether to log validation errors
   */
  logErrors: process.env.NODE_ENV === 'development',
} as const;

/**
 * Validation error class for environment validation failures
 */
export class EnvValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError,
    public context: 'client' | 'server'
  ) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Format Zod validation errors for better readability
 */
export function formatEnvErrors(errors: z.ZodError): string {
  const errorMessages = errors.issues.map((issue) => {
    const path = issue.path.join('.');
    const message = issue.message;
    return `  ${path}: ${message}`;
  });

  return `Environment validation failed:\n${errorMessages.join('\n')}`;
}

/**
 * Validate environment variables with proper error handling
 */
export function validateEnv<T extends z.ZodSchema>(
  schema: T,
  env: Record<string, string | undefined>,
  context: 'client' | 'server'
): z.infer<T> {
  try {
    return schema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatEnvErrors(error);

      if (envConfig.logErrors) {
        console.error(formattedError);
      }

      if (envConfig.throwOnError && !envConfig.skipValidation) {
        throw new EnvValidationError(
          `Environment validation failed for ${context}`,
          error,
          context
        );
      }

      // Return a partial object with defaults for non-critical errors
      // Note: This is a fallback for non-critical environments
      if (context === 'client') {
        return clientEnvSchema.partial().parse(env) as z.infer<T>;
      } else {
        return serverEnvSchema.partial().parse(env) as z.infer<T>;
      }
    }

    throw error;
  }
}

/**
 * Validate client-side environment variables
 */
export function validateClientEnv(): ClientEnv {
  const clientEnv = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };

  return validateEnv(clientEnvSchema, clientEnv, 'client');
}

/**
 * Validate server-side environment variables
 */
export function validateServerEnv(): ServerEnv {
  return validateEnv(serverEnvSchema, process.env, 'server');
}

/**
 * Get validated environment variables for the current context
 */
export function getEnv(): ServerEnv {
  return validateServerEnv();
}

/**
 * Get validated client environment variables
 */
export function getClientEnv(): ClientEnv {
  return validateClientEnv();
}

/**
 * Type guard to check if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Type guard to check if running on client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get environment variables for the current context (client or server)
 */
export function getContextualEnv(): ClientEnv | ServerEnv {
  return isServer() ? getEnv() : getClientEnv();
}

/**
 * Environment variable validation result
 */
export interface EnvValidationResult {
  success: boolean;
  data?: ServerEnv | ClientEnv;
  error?: EnvValidationError;
}

/**
 * Validate environment variables and return result without throwing
 */
export function tryValidateEnv(): EnvValidationResult {
  try {
    const data = getContextualEnv();
    return { success: true, data };
  } catch (error) {
    if (error instanceof EnvValidationError) {
      return { success: false, error };
    }
    throw error;
  }
}
