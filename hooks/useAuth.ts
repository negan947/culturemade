'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string | null;
}

interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email });
      } else {
        setUser(null);
      }
    } catch (e: any) {
      setUser(null);
      setError(e?.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadUser();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
    });
    return () => subscription.subscription?.unsubscribe();
  }, [supabase, loadUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return false;
      }
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
      }
      return true;
    } catch (e: any) {
      setError(e?.message || 'Sign in failed');
      return false;
    }
  }, [supabase]);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
        return false;
      }
      if (data.user) {
        // In dev, user may be confirmed immediately
        setUser({ id: data.user.id, email: data.user.email });
      }
      return true;
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
      return false;
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (e) {
      // ignore
    }
  }, [supabase]);

  return {
    user,
    loading,
    error,
    signIn,
    register,
    signOut,
    reload: loadUser,
  };
}

export default useAuth;


