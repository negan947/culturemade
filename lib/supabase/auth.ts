import { redirect } from 'next/navigation';
import { cache } from 'react';


import { logSecurityEvent } from '@/lib/utils/security';

import { createClient } from './server';

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    logSecurityEvent('AUTH_ERROR', { error: error.message });
  }

  return { user, error };
}

export async function requireAuth() {
  const { user, error } = await getUser();
  if (error || !user) {
    redirect('/login');
  }
  return user;
}

export async function requireAdmin() {
  const supabase = await createClient();
  const user = await requireAuth();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) {
    logSecurityEvent('PROFILE_FETCH_ERROR', {
      userId: user.id,
      error: error.message,
    });
    redirect('/');
  }

  if (profile?.role !== 'admin') {
    logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', {
      userId: user.id,
      role: profile?.role,
    });
    redirect('/');
  }

  return user;
}

// Get user profile with caching
export const getUserProfile = cache(async () => {
  try {
    const supabase = await createClient();
    const { user, error: userError } = await getUser();

    if (userError || !user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      logSecurityEvent('PROFILE_FETCH_ERROR', {
        userId: user.id,
        error: error.message,
      });
      return null;
    }

    return { user, profile };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
});

// Add missing getUserContext export
export const getUserContext = cache(async () => {
  const { user } = await getUser();
  if (!user) return null;
  
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return { user, profile };
});
