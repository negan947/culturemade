/**
 * Error handling utilities with retry mechanisms and user-friendly messaging
 */

// Error classification types
export type ErrorCategory = 'network' | 'server' | 'client' | 'validation' | 'timeout' | 'authentication' | 'permission' | 'rate_limit' | 'unknown';

export interface ErrorInfo {
  category: ErrorCategory;
  message: string;
  code?: string | number;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  technicalDetails?: Record<string, any>;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter?: boolean;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true,
};

// Classify error based on various factors
export function classifyError(error: Error | Response | string | any): ErrorInfo {
  // Handle Response objects (fetch responses)
  if (error instanceof Response) {
    return classifyHttpError(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    return classifyJavaScriptError(error);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      category: 'unknown',
      message: error,
      retryable: false,
      severity: 'medium',
      userMessage: error,
    };
  }

  // Handle custom error objects
  if (error && typeof error === 'object') {
    return classifyCustomError(error);
  }

  return {
    category: 'unknown',
    message: 'An unknown error occurred',
    retryable: false,
    severity: 'medium',
    userMessage: 'Something went wrong. Please try again.',
  };
}

// Classify HTTP response errors
function classifyHttpError(response: Response): ErrorInfo {
  const status = response.status;
  const statusText = response.statusText;

  let category: ErrorCategory;
  let retryable = false;
  let severity: ErrorInfo['severity'] = 'medium';
  let userMessage: string;

  if (status >= 500) {
    category = 'server';
    retryable = true;
    severity = 'high';
    userMessage = 'Our servers are experiencing issues. Please try again in a moment.';
  } else if (status === 429) {
    category = 'rate_limit';
    retryable = true;
    severity = 'medium';
    userMessage = 'Too many requests. Please wait a moment and try again.';
  } else if (status === 408 || status === 504) {
    category = 'timeout';
    retryable = true;
    severity = 'medium';
    userMessage = 'The request timed out. Please try again.';
  } else if (status === 401) {
    category = 'authentication';
    retryable = false;
    severity = 'high';
    userMessage = 'Please sign in to continue.';
  } else if (status === 403) {
    category = 'permission';
    retryable = false;
    severity = 'high';
    userMessage = 'You don\'t have permission to access this resource.';
  } else if (status >= 400) {
    category = 'client';
    retryable = false;
    severity = 'medium';
    userMessage = 'Please check your request and try again.';
  } else {
    category = 'unknown';
    retryable = false;
    severity = 'medium';
    userMessage = 'An unexpected error occurred.';
  }

  return {
    category,
    message: `HTTP ${status}: ${statusText}`,
    code: status,
    retryable,
    severity,
    userMessage,
    technicalDetails: {
      status,
      statusText,
      url: response.url,
    },
  };
}

// Classify JavaScript Error objects
function classifyJavaScriptError(error: Error): ErrorInfo {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  let category: ErrorCategory;
  let retryable = false;
  let severity: ErrorInfo['severity'] = 'medium';
  let userMessage: string;

  // Network errors
  if (message.includes('fetch') || 
      message.includes('network') || 
      name === 'networkerror' ||
      message.includes('failed to fetch')) {
    category = 'network';
    retryable = true;
    severity = 'high';
    userMessage = 'Unable to connect. Please check your internet connection and try again.';
  }
  // Timeout errors
  else if (message.includes('timeout') || 
           name === 'aborterror' ||
           message.includes('signal aborted')) {
    category = 'timeout';
    retryable = true;
    severity = 'medium';
    userMessage = 'The request timed out. Please try again.';
  }
  // Validation errors
  else if (name === 'validationerror' || 
           message.includes('validation') ||
           message.includes('invalid')) {
    category = 'validation';
    retryable = false;
    severity = 'low';
    userMessage = 'Please check your input and try again.';
  }
  // Syntax/Type errors (client-side issues)
  else if (name === 'syntaxerror' || 
           name === 'typeerror' ||
           name === 'referenceerror') {
    category = 'client';
    retryable = false;
    severity = 'critical';
    userMessage = 'A technical error occurred. Please refresh the page.';
  }
  else {
    category = 'unknown';
    retryable = false;
    severity = 'medium';
    userMessage = 'An unexpected error occurred. Please try again.';
  }

  return {
    category,
    message: error.message,
    code: error.name,
    retryable,
    severity,
    userMessage,
    technicalDetails: {
      name: error.name,
      stack: error.stack,
    },
  };
}

// Classify custom error objects
function classifyCustomError(error: any): ErrorInfo {
  const category: ErrorCategory = error.category || error.type || 'unknown';
  const message = error.message || error.msg || 'Unknown error';
  const code = error.code || error.status;
  const retryable = error.retryable ?? false;
  const severity = error.severity || 'medium';
  const userMessage = error.userMessage || getUserFriendlyMessage(category, message);

  return {
    category,
    message,
    code,
    retryable,
    severity,
    userMessage,
    technicalDetails: error.details || error.meta,
  };
}

// Get user-friendly message based on error category
export function getUserFriendlyMessage(category: ErrorCategory, originalMessage?: string): string {
  switch (category) {
    case 'network':
      return 'Unable to connect to the internet. Please check your connection and try again.';
    case 'server':
      return 'Our servers are experiencing issues. Please try again in a moment.';
    case 'timeout':
      return 'The request timed out. Please try again.';
    case 'authentication':
      return 'Please sign in to continue.';
    case 'permission':
      return 'You don\'t have permission to access this resource.';
    case 'validation':
      return 'Please check your input and try again.';
    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.';
    case 'client':
      return 'A technical error occurred. Please refresh the page.';
    default:
      return originalMessage || 'Something went wrong. Please try again.';
  }
}

// Calculate retry delay with exponential backoff
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const baseDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const delayWithCap = Math.min(baseDelay, config.maxDelay);
  
  if (config.jitter) {
    // Add random jitter (±25% of the delay)
    const jitterRange = delayWithCap * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, delayWithCap + jitter);
  }
  
  return delayWithCap;
}

// Retry function with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: ErrorInfo) => void
): Promise<T> {
  let lastError: ErrorInfo;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifyError(error);

      // Don't retry if error is not retryable or this is the last attempt
      if (!lastError.retryable || attempt === config.maxAttempts) {
        throw lastError;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      const delay = calculateRetryDelay(attempt, config);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Create a timeout wrapper for promises
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    }),
  ]);
}

// Circuit breaker implementation for handling repeated failures
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open. Service temporarily unavailable.');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

// Error aggregation for multiple operations
export class ErrorAggregator {
  private errors: ErrorInfo[] = [];

  add(error: Error | Response | string | any): void {
    this.errors.push(classifyError(error));
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  getMostSevere(): ErrorInfo | null {
    if (this.errors.length === 0) return null;

    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    
    return this.errors.reduce((mostSevere, current) => {
      return severityOrder[current.severity] > severityOrder[mostSevere.severity]
        ? current
        : mostSevere;
    });
  }

  getRetryableErrors(): ErrorInfo[] {
    return this.errors.filter(error => error.retryable);
  }

  clear(): void {
    this.errors = [];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrorCount(): number {
    return this.errors.length;
  }
}

// Create a safe async wrapper that won't throw
export function safe<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: ErrorInfo }> {
  return operation()
    .then(data => ({ success: true as const, data }))
    .catch(error => ({ success: false as const, error: classifyError(error) }));
}

// Batch error handling for multiple operations
export async function batchWithErrorHandling<T>(
  operations: (() => Promise<T>)[],
  continueOnError = true
): Promise<{
  results: T[];
  errors: ErrorInfo[];
  successCount: number;
  failureCount: number;
}> {
  const results: T[] = [];
  const errors: ErrorInfo[] = [];

  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result);
    } catch (error) {
      const errorInfo = classifyError(error);
      errors.push(errorInfo);
      
      if (!continueOnError) {
        break;
      }
    }
  }

  return {
    results,
    errors,
    successCount: results.length,
    failureCount: errors.length,
  };
}