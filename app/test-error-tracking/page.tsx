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
      console.error('Error testing error tracking:', error);
      setTestResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Test Error Tracking</h1>
      {/* Add error tracking test interface here */}
    </div>
  );
}
