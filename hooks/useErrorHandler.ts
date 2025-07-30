'use client';

import { useState, useCallback, useRef } from 'react';

// Error types for different scenarios
export type ErrorType = 'network' | 'server' | 'timeout' | 'validation' | 'authentication' | 'unknown';

export interface ErrorState {
  type: ErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  retryCount: number;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: ErrorType[];
  onError?: (error: ErrorState) => void;
  onRetry?: (error: ErrorState, attempt: number) => void;
  onMaxRetriesReached?: (error: ErrorState) => void;
}

interface UseErrorHandlerReturn {
  error: ErrorState | null;
  isRetrying: boolean;
  hasError: boolean;
  clearError: () => void;
  handleError: (error: Error | string, context?: Record<string, any>) => void;
  retry: () => Promise<void>;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ) => (...args: T) => Promise<R>;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: ['network', 'timeout', 'server'],
};

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const config: RetryConfig = {
    ...DEFAULT_CONFIG,
    maxRetries: options.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    initialDelay: options.initialDelay ?? DEFAULT_CONFIG.initialDelay,
    maxDelay: options.maxDelay ?? DEFAULT_CONFIG.maxDelay,
    backoffMultiplier: options.backoffMultiplier ?? DEFAULT_CONFIG.backoffMultiplier,
    retryableErrors: options.retryableErrors ?? DEFAULT_CONFIG.retryableErrors,
  };

  const [error, setError] = useState<ErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFailedOperationRef = useRef<(() => Promise<void>) | null>(null);

  // Determine error type from error object
  const determineErrorType = useCallback((error: Error | string): ErrorType => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorName = typeof error === 'string' ? '' : error.name;

    // Network errors
    if (errorMessage.includes('fetch') || 
        errorMessage.includes('network') || 
        errorMessage.includes('NetworkError') ||
        errorName === 'TypeError' && errorMessage.includes('Failed to fetch')) {
      return 'network';
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || 
        errorMessage.includes('AbortError') ||
        errorName === 'AbortError') {
      return 'timeout';
    }

    // Server errors (HTTP 5xx)
    if (errorMessage.includes('500') || 
        errorMessage.includes('502') || 
        errorMessage.includes('503') || 
        errorMessage.includes('504') ||
        errorMessage.includes('Internal Server Error') ||
        errorMessage.includes('Bad Gateway') ||
        errorMessage.includes('Service Unavailable') ||
        errorMessage.includes('Gateway Timeout')) {
      return 'server';
    }

    // Authentication errors (HTTP 401, 403)
    if (errorMessage.includes('401') || 
        errorMessage.includes('403') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('Forbidden')) {
      return 'authentication';
    }

    // Validation errors (HTTP 400, 422)
    if (errorMessage.includes('400') || 
        errorMessage.includes('422') ||
        errorMessage.includes('Bad Request') ||
        errorMessage.includes('Validation') ||
        errorMessage.includes('Invalid')) {
      return 'validation';
    }

    return 'unknown';
  }, []);

  // Get user-friendly error message
  const getUserFriendlyMessage = useCallback((errorType: ErrorType, originalMessage: string): string => {
    switch (errorType) {
      case 'network':
        return 'Unable to connect to the internet. Please check your connection and try again.';
      case 'timeout':
        return 'The request timed out. Please try again.';
      case 'server':
        return 'Our servers are experiencing issues. Please try again in a moment.';
      case 'authentication':
        return 'You need to sign in to continue.';
      case 'validation':
        return 'Please check your input and try again.';
      default:
        return originalMessage || 'An unexpected error occurred. Please try again.';
    }
  }, []);

  // Calculate retry delay with exponential backoff
  const calculateRetryDelay = useCallback((retryCount: number): number => {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, retryCount);
    return Math.min(delay, config.maxDelay);
  }, [config]);

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Handle error with retry logic
  const handleError = useCallback((
    error: Error | string, 
    context?: Record<string, any>
  ) => {
    const errorType = determineErrorType(error);
    const originalMessage = typeof error === 'string' ? error : error.message;
    const userMessage = getUserFriendlyMessage(errorType, originalMessage);
    const isRetryable = config.retryableErrors.includes(errorType);

    const errorState: ErrorState = {
      type: errorType,
      message: userMessage,
      code: typeof error === 'object' && 'code' in error ? error.code as string : undefined,
      retryable: isRetryable,
      retryCount: error && typeof error === 'object' && 'retryCount' in error 
        ? (error as any).retryCount 
        : 0,
      timestamp: new Date(),
      context,
    };

    setError(errorState);
    setIsRetrying(false);

    // Call error callback
    if (options.onError) {
      options.onError(errorState);
    }

    // Log error for debugging
    console.error('Error handled:', {
      type: errorType,
      message: originalMessage,
      context,
      retryable: isRetryable,
    });
  }, [determineErrorType, getUserFriendlyMessage, config.retryableErrors, options]);

  // Retry the last failed operation
  const retry = useCallback(async (): Promise<void> => {
    if (!error || !error.retryable || !lastFailedOperationRef.current) {
      return;
    }

    if (error.retryCount >= config.maxRetries) {
      if (options.onMaxRetriesReached) {
        options.onMaxRetriesReached(error);
      }
      return;
    }

    setIsRetrying(true);
    
    const delay = calculateRetryDelay(error.retryCount);
    
    // Call retry callback
    if (options.onRetry) {
      options.onRetry(error, error.retryCount + 1);
    }

    return new Promise((resolve, reject) => {
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          await lastFailedOperationRef.current!();
          clearError();
          resolve();
        } catch (retryError) {
          const updatedError = {
            ...error,
            retryCount: error.retryCount + 1,
            timestamp: new Date(),
          };
          
          if (updatedError.retryCount >= config.maxRetries) {
            setError(updatedError);
            setIsRetrying(false);
            
            if (options.onMaxRetriesReached) {
              options.onMaxRetriesReached(updatedError);
            }
          } else {
            handleError(retryError as Error, error.context);
          }
          
          reject(retryError);
        }
      }, delay);
    });
  }, [error, config.maxRetries, calculateRetryDelay, options, clearError, handleError]);

  // Wrapper function to handle errors automatically
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ) => {
    return async (...args: T): Promise<R> => {
      lastFailedOperationRef.current = () => fn(...args);
      
      try {
        clearError();
        const result = await fn(...args);
        return result;
      } catch (error) {
        handleError(error as Error, context);
        throw error;
      }
    };
  }, [clearError, handleError]);

  return {
    error,
    isRetrying,
    hasError: error !== null,
    clearError,
    handleError,
    retry,
    withErrorHandling,
  };
}