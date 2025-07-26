'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';


import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component';
  // eslint-disable-next-line no-unused-vars
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Custom Error Boundary
 * Provides different fallback UIs based on the error level
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    // console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportFeedback = () => {
    // Simple feedback - just log or could integrate with other services
    // console.log('User reported feedback for error:', this.state.error);
  };

  override render() {
    if (this.state.hasError) {
      // Show custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on error level
      return this.renderDefaultFallback();
    }

    return this.props.children;
  }

  private renderDefaultFallback() {
    const { level = 'component', showDetails = false } = this.props;
    const { error, errorInfo } = this.state;

    switch (level) {
      case 'page':
        return (
          <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
            <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4'>
                <AlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <h1 className='text-xl font-semibold text-gray-900 mb-2'>
                Something went wrong
              </h1>
              <p className='text-gray-600 mb-6'>
                We&apos;re sorry, but something went wrong. Please try again or
                go back to the homepage.
              </p>
              <div className='space-y-3'>
                <Button onClick={this.handleRetry} className='w-full'>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Try Again
                </Button>
                <Button
                  variant='outline'
                  onClick={() => (window.location.href = '/')}
                  className='w-full'
                >
                  <Home className='h-4 w-4 mr-2' />
                  Go Home
                </Button>
              </div>
              {showDetails && error && (
                <details className='mt-6 text-left'>
                  <summary className='cursor-pointer text-sm text-gray-500'>
                    Error Details
                  </summary>
                  <pre className='mt-2 text-xs text-gray-700 bg-gray-100 p-3 rounded overflow-auto'>
                    {error.toString()}
                    {errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        );

      case 'section':
        return (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 m-4'>
            <div className='flex items-center'>
              <AlertTriangle className='h-5 w-5 text-red-600 mr-2' />
              <h3 className='text-sm font-medium text-red-800'>
                Section Error
              </h3>
            </div>
            <p className='mt-1 text-sm text-red-700'>
              This section encountered an error. Please try refreshing.
            </p>
            <div className='mt-3 flex space-x-2'>
              <Button size='sm' onClick={this.handleRetry}>
                <RefreshCw className='h-3 w-3 mr-1' />
                Retry
              </Button>
            </div>
            {showDetails && error && (
              <details className='mt-3'>
                <summary className='cursor-pointer text-xs text-red-600'>
                  Details
                </summary>
                <pre className='mt-1 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto'>
                  {error.toString()}
                </pre>
              </details>
            )}
          </div>
        );

      default: // component level
        return (
          <div className='bg-yellow-50 border border-yellow-200 rounded p-3 m-2'>
            <div className='flex items-center text-yellow-800'>
              <AlertTriangle className='h-4 w-4 mr-2' />
              <span className='text-sm'>Component Error</span>
            </div>
            <div className='mt-2 flex space-x-2'>
              <Button size='sm' variant='outline' onClick={this.handleRetry}>
                <RefreshCw className='h-3 w-3 mr-1' />
                Retry
              </Button>
            </div>
          </div>
        );
    }
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  errorBoundaryConfig?: Omit<Props, 'children'>
) {
  const ComponentWithErrorBoundary = (props: T) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
}

/**
 * Hook to trigger error boundary for testing
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}
