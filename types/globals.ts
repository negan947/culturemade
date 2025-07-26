// Global TypeScript utility types and export patterns for CultureMade
// This file ensures consistent typing patterns across the entire application

// ===== COMMON UTILITY TYPES =====

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ===== COMPONENT TYPES =====

// Standard component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Form types
export interface FormFieldError {
  message: string;
  type: string;
}

export interface FormState<T = any> {
  data: T;
  errors: Record<string, FormFieldError>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// ===== ASYNC OPERATION TYPES =====

// Async operation state
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

// Promise with loading state
export type AsyncOperation<T> = Promise<{
  data: T;
  error?: string;
}>;

// ===== UTILITY TYPES =====

// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Make specific properties required
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Omit properties recursively
export type DeepOmit<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P] extends object
    ? DeepOmit<T[P], K>
    : T[P];
};

// Extract function return type
// eslint-disable-next-line no-unused-vars
export type ReturnTypeAsync<T> = T extends (..._args: any[]) => Promise<infer R>
  ? R
  : never;

// ===== ENVIRONMENT TYPES =====

// Environment variables with strict typing
export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SITE_LOCKED?: string;
  STRIPE_SECRET_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SENTRY_DSN?: string;
  RESEND_API_KEY?: string;
}

// ===== BRAND SPECIFIC TYPES =====

// CultureMade specific types
export type CultureMadeTheme = 'light' | 'dark' | 'auto';

export interface CultureMadeConfig {
  theme: CultureMadeTheme;
  language: string;
  currency: string;
  timezone: string;
}

// ===== EXPORT PATTERNS =====

// Re-export common types from database
export type { Database } from './database';

// Export all utility functions with consistent naming
export * from '@/lib/utils';

// Export hooks with consistent naming pattern
// export * from '@/hooks'; // TODO: Uncomment when hooks directory is created

// ===== TYPE GUARDS =====

// Type guard utilities
export const isString = (value: unknown): value is string =>
  typeof value === 'string';
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number';
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';
export const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isArray = (value: unknown): value is any[] => Array.isArray(value);
export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function';

// API response type guards
export const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  isObject(value) &&
  'success' in value &&
  typeof value['success'] === 'boolean';

export const isApiError = (value: unknown): value is ApiError =>
  isObject(value) && 'message' in value && isString(value['message']);

// ===== BRAND CONSISTENCY =====

// Ensure consistent naming patterns
export const CULTUREMADE_CONSTANTS = {
  BRAND_NAME: 'CultureMade',
  BRAND_TAGLINE: 'Where Culture Meets Commerce',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_TIMEZONE: 'UTC',
} as const;

// ===== MODULE AUGMENTATION =====

// Extend global types if needed
declare global {
  // eslint-disable-next-line no-unused-vars
  namespace NodeJS {
    // eslint-disable-next-line no-unused-vars
    interface ProcessEnv extends EnvironmentVariables {}
  }
}

// ===== STRICT EXPORT PATTERN =====

// All exports should be explicit and documented
export default {
  CULTUREMADE_CONSTANTS,
  // Add more default exports as needed
} as const;
