'use client';

import { useState } from 'react';

export default function TestErrorTrackingPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testType: 'quick' | 'all') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/test-error-tracking?type=${testType}`);
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to run test',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerTestError = () => {
    // This will be caught by error boundaries
    throw new Error('Test error for error boundary demonstration');
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <h1 className='text-3xl font-bold mb-6'>Error Tracking Test Suite</h1>

      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
        <h2 className='text-lg font-semibold mb-2'>
          🧪 Test Error Tracking Setup
        </h2>
        <p className='text-gray-700 mb-4'>
          This page tests the error tracking and logging functionality
          implemented in step 0.2.1.
        </p>

        <div className='space-x-4'>
          <button
            onClick={() => runTest('quick')}
            disabled={isLoading}
            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50'
          >
            {isLoading ? 'Running...' : 'Quick Test'}
          </button>

          <button
            onClick={() => runTest('all')}
            disabled={isLoading}
            className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50'
          >
            {isLoading ? 'Running...' : 'Full Test Suite'}
          </button>

          <button
            onClick={triggerTestError}
            className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
          >
            Test Error Boundary
          </button>
        </div>
      </div>

      {testResult && (
        <div
          className={`border rounded-lg p-4 mb-6 ${
            testResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <h3 className='text-lg font-semibold mb-2'>
            {testResult.success ? '✅ Test Results' : '❌ Test Failed'}
          </h3>

          <div className='space-y-2'>
            <p>
              <strong>Message:</strong> {testResult.message}
            </p>

            {testResult.error && (
              <p className='text-red-700'>
                <strong>Error:</strong> {testResult.error}
              </p>
            )}

            {testResult.results && (
              <div className='mt-4'>
                <h4 className='font-semibold mb-2'>Detailed Results:</h4>
                <pre className='bg-gray-100 p-3 rounded text-sm overflow-auto'>
                  {JSON.stringify(testResult.results, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
        <h3 className='text-lg font-semibold mb-2'>📋 What This Tests</h3>
        <ul className='list-disc list-inside space-y-1 text-gray-700'>
          <li>Structured logging with Pino</li>
          <li>Sentry integration and error tracking</li>
          <li>Performance monitoring</li>
          <li>Error boundaries functionality</li>
          <li>Log levels and environment configuration</li>
          <li>Module-specific loggers (auth, database, security, etc.)</li>
        </ul>
      </div>
    </div>
  );
}
