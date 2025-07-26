'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

interface TestResult {
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  details?: Record<string, unknown> | undefined;
}

interface AuthState {
  user: {
    id: string;
    email?: string;
    created_at: string;
    user_metadata?: Record<string, unknown>;
  } | null;
  profile: {
    id: string;
    role: string;
    full_name?: string;
  } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export default function TestAuth() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isAuthenticated: false,
    isAdmin: false,
  });
  const [testCredentials, setTestCredentials] = useState({
    email: 'test@example.com',
    password: 'testpassword123',
    adminEmail: 'admin@example.com',
    adminPassword: 'adminpassword123',
  });
  const [isRunningAll, setIsRunningAll] = useState(false);

  const supabase = createClient();

  // Update test result
  const updateTest = (
    name: string,
    status: TestResult['status'],
    message: string,
    details?: Record<string, unknown>
  ) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name);
      if (existing) {
        return prev.map((t) =>
          t.name === name ? { ...t, status, message, details } : t
        );
      } else {
        return [...prev, { name, status, message, details }];
      }
    });
  };

  // Check current auth state
  const checkAuthState = useCallback(async () => {
    updateTest(
      'Auth State Check',
      'running',
      'Checking current authentication state...'
    );

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      let profile = null;
      let isAdmin = false;

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        profile = profileData;
        isAdmin = profileData?.role === 'admin';
      }

      setAuthState({
        user,
        profile,
        isAuthenticated: !!user,
        isAdmin,
      });

      updateTest(
        'Auth State Check',
        'success',
        user
          ? `Authenticated as ${user.email} (${profile?.role || 'no role'})`
          : 'Not authenticated',
        { user, profile }
      );
    } catch (error) {
      updateTest(
        'Auth State Check',
        'error',
        `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [supabase]);

  // Test user registration
  const testRegistration = async () => {
    updateTest('User Registration', 'running', 'Testing user registration...');

    try {
      const testEmail = `test-${Date.now()}@example.com`;

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testCredentials.password,
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      });

      if (error) throw error;

      updateTest(
        'User Registration',
        'success',
        `Registration successful for ${testEmail}`,
        { user: data.user, session: data.session }
      );
    } catch (error) {
      updateTest(
        'User Registration',
        'error',
        `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Test user login
  const testLogin = async () => {
    updateTest('User Login', 'running', 'Testing user login...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testCredentials.email,
        password: testCredentials.password,
      });

      if (error) throw error;

      updateTest(
        'User Login',
        'success',
        `Login successful for ${testCredentials.email}`,
        { user: data.user, session: data.session }
      );

      // Update auth state after login
      await checkAuthState();
    } catch (error) {
      updateTest(
        'User Login',
        'error',
        `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Test logout
  const testLogout = async () => {
    updateTest('User Logout', 'running', 'Testing user logout...');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      updateTest('User Logout', 'success', 'Logout successful');

      // Update auth state after logout
      await checkAuthState();
    } catch (error) {
      updateTest(
        'User Logout',
        'error',
        `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Test protected route access
  const testProtectedRoutes = async () => {
    updateTest(
      'Protected Routes',
      'running',
      'Testing protected route access...'
    );

    try {
      // Test customer protected route
      const accountResponse = await fetch('/account', { method: 'HEAD' });
      const checkoutResponse = await fetch('/checkout', { method: 'HEAD' });
      const ordersResponse = await fetch('/orders', { method: 'HEAD' });

      const results = {
        account: accountResponse.status,
        checkout: checkoutResponse.status,
        orders: ordersResponse.status,
      };

      updateTest(
        'Protected Routes',
        'success',
        'Protected routes tested',
        results
      );
    } catch (error) {
      updateTest(
        'Protected Routes',
        'error',
        `Protected routes test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Test admin route access
  const testAdminRoutes = async () => {
    updateTest('Admin Routes', 'running', 'Testing admin route access...');

    try {
      const adminResponse = await fetch('/admin', { method: 'HEAD' });

      const results = {
        admin: adminResponse.status,
        isAuthenticated: authState.isAuthenticated,
        isAdmin: authState.isAdmin,
      };

      updateTest(
        'Admin Routes',
        'success',
        `Admin route tested (Status: ${adminResponse.status})`,
        results
      );
    } catch (error) {
      updateTest(
        'Admin Routes',
        'error',
        `Admin routes test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Test rate limiting
  const testRateLimiting = async () => {
    updateTest(
      'Rate Limiting',
      'running',
      'Testing rate limiting on auth routes...'
    );

    try {
      const requests = [];
      const testEmail = 'nonexistent@example.com';

      // Make multiple rapid login attempts to trigger rate limiting
      for (let i = 0; i < 7; i++) {
        requests.push(
          supabase.auth.signInWithPassword({
            email: testEmail,
            password: 'wrongpassword',
          })
        );
      }

      const results = await Promise.allSettled(requests);
      const errors = results.filter((r) => r.status === 'rejected');
      const auths = results.filter((r) => r.status === 'fulfilled');

      updateTest(
        'Rate Limiting',
        'success',
        `Rate limiting test completed. ${auths.length} attempts processed, ${errors.length} blocked`,
        { results: results.map((r) => r.status) }
      );
    } catch (error) {
      updateTest(
        'Rate Limiting',
        'error',
        `Rate limiting test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Test password reset
  const testPasswordReset = async () => {
    updateTest(
      'Password Reset',
      'running',
      'Testing password reset functionality...'
    );

    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost:3000';
      const { error } = await supabase.auth.resetPasswordForEmail(
        testCredentials.email,
        {
          redirectTo: `${origin}/reset-password`,
        }
      );

      if (error) throw error;

      updateTest(
        'Password Reset',
        'success',
        `Password reset email sent to ${testCredentials.email}`
      );
    } catch (error) {
      updateTest(
        'Password Reset',
        'error',
        `Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Test profile creation
  const testProfileCreation = async () => {
    updateTest('Profile Creation', 'running', 'Testing profile creation...');

    try {
      if (!authState.user) {
        throw new Error('No authenticated user found');
      }

      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authState.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        updateTest(
          'Profile Creation',
          'success',
          'Profile already exists',
          existingProfile
        );
      } else {
        // Create profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authState.user.id,
            role: 'customer',
            full_name:
              (authState.user.user_metadata?.['full_name'] as string) ||
              'Test User',
          })
          .select()
          .single();

        if (createError) throw createError;

        updateTest(
          'Profile Creation',
          'success',
          'Profile created successfully',
          newProfile
        );
      }
    } catch (error) {
      updateTest(
        'Profile Creation',
        'error',
        `Profile creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningAll(true);
    setTests([]);

    await checkAuthState();
    await testRegistration();
    await testLogin();
    await testProtectedRoutes();
    await testAdminRoutes();
    await testRateLimiting();
    await testPasswordReset();
    await testProfileCreation();

    setIsRunningAll(false);
  };

  // Initialize with auth state check
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'running':
        return '🔄';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className='container mx-auto p-8 max-w-6xl'>
      <h1 className='text-4xl font-bold mb-6'>
        🔐 Authentication System Test Suite
      </h1>

      {/* Auth State Summary */}
      <div className='mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg'>
        <h2 className='text-2xl font-semibold text-blue-800 mb-4'>
          Current Authentication State
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='p-3 bg-white rounded border'>
            <span className='text-sm text-gray-600'>Status:</span>
            <p className='font-semibold'>
              {authState.isAuthenticated
                ? '🟢 Authenticated'
                : '🔴 Not Authenticated'}
            </p>
          </div>
          <div className='p-3 bg-white rounded border'>
            <span className='text-sm text-gray-600'>User:</span>
            <p className='font-semibold'>{authState.user?.email || 'None'}</p>
          </div>
          <div className='p-3 bg-white rounded border'>
            <span className='text-sm text-gray-600'>Role:</span>
            <p className='font-semibold'>{authState.profile?.role || 'None'}</p>
          </div>
          <div className='p-3 bg-white rounded border'>
            <span className='text-sm text-gray-600'>Admin:</span>
            <p className='font-semibold'>
              {authState.isAdmin ? '🔑 Yes' : '👤 No'}
            </p>
          </div>
        </div>
      </div>

      {/* Test Credentials */}
      <div className='mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg'>
        <h2 className='text-xl font-semibold mb-4'>Test Credentials</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='email'>Test Email</Label>
            <Input
              id='email'
              value={testCredentials.email}
              onChange={(e) =>
                setTestCredentials({
                  ...testCredentials,
                  email: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor='password'>Test Password</Label>
            <Input
              id='password'
              type='password'
              value={testCredentials.password}
              onChange={(e) =>
                setTestCredentials({
                  ...testCredentials,
                  password: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className='mb-8 flex flex-wrap gap-3'>
        <Button
          onClick={runAllTests}
          disabled={isRunningAll}
          className='bg-blue-600 hover:bg-blue-700'
        >
          {isRunningAll ? '🔄 Running Tests...' : '🚀 Run All Tests'}
        </Button>
        <Button onClick={checkAuthState} variant='outline'>
          🔍 Check Auth State
        </Button>
        <Button onClick={testLogin} variant='outline'>
          🔑 Test Login
        </Button>
        <Button onClick={testLogout} variant='outline'>
          🚪 Test Logout
        </Button>
        <Button onClick={testProtectedRoutes} variant='outline'>
          🛡️ Test Protected Routes
        </Button>
      </div>

      {/* Test Results */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold mb-4'>Test Results</h2>

        {tests.length === 0 && (
          <div className='p-6 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
            No tests run yet. Click &quot;Run All Tests&quot; to start testing.
          </div>
        )}

        {tests.map((test, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-lg'>{getStatusIcon(test.status)}</span>
                  <h3 className='font-semibold text-lg'>{test.name}</h3>
                </div>
                <p className='mb-2'>{test.message}</p>

                {test.details && (
                  <details className='mt-2'>
                    <summary className='cursor-pointer text-sm font-medium'>
                      View Details
                    </summary>
                    <pre className='mt-2 p-3 bg-white bg-opacity-50 rounded text-xs overflow-auto'>
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Information */}
      <div className='mt-12 p-6 bg-gray-900 text-white rounded-lg'>
        <h2 className='text-xl font-semibold mb-4'>🔧 System Information</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
          <div>
            <strong>Environment:</strong>{' '}
            {process.env.NODE_ENV || 'development'}
          </div>
          <div>
            <strong>Supabase URL:</strong>{' '}
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? '✅ Configured'
              : '❌ Missing'}
          </div>
          <div>
            <strong>Auth Callback:</strong>{' '}
            {typeof window !== 'undefined'
              ? window.location.origin
              : 'http://localhost:3000'}
            /api/auth/callback
          </div>
        </div>
      </div>
    </div>
  );
}
