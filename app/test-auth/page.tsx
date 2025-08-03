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
    } catch (error: any) {
      updateTest(
        'Auth State Check',
        'error',
        `Authentication check failed: ${error.message}`,
        { error: error.message }
      );
    }
  }, []);

  useEffect(() => {
    checkAuthState();
  }, []);

  return (
    <div>
      <h1>Test Auth</h1>
      {/* Add auth testing interface here */}
    </div>
  );
}
