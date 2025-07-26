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
  const supabase = await createClient();
  const { user } = await getUser();

  if (!user) return null;

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
});

// Check if user is admin
export async function isAdmin() {
  const userProfile = await getUserProfile();
  return userProfile?.profile?.role === 'admin';
}

// Check if user is authenticated
export async function isAuthenticated() {
  const { user } = await getUser();
  return !!user;
}

// Get user role
export async function getUserRole() {
  const userProfile = await getUserProfile();
  return userProfile?.profile?.role || null;
}

// Create or update user profile
export async function createOrUpdateProfile(userData: {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}) {
  const supabase = await createClient();
  const user = await requireAuth();

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...userData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logSecurityEvent('PROFILE_UPDATE_ERROR', {
      userId: user.id,
      error: error.message,
    });
    throw error;
  }

  logSecurityEvent('PROFILE_UPDATED', { userId: user.id });
  return data;
}

// Sign out user
export async function signOut() {
  const supabase = await createClient();
  const { user } = await getUser();

  if (user) {
    logSecurityEvent('USER_SIGNED_OUT', { userId: user.id });
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    logSecurityEvent('SIGN_OUT_ERROR', { error: error.message });
    throw error;
  }

  redirect('/login');
}

// Check if user has specific permission
export async function hasPermission(permission: string) {
  const userProfile = await getUserProfile();

  if (!userProfile) return false;

  // Admin has all permissions
  if (userProfile.profile?.role === 'admin') return true;

  // Add more granular permissions here if needed
  const customerPermissions = [
    'view_orders',
    'create_orders',
    'update_profile',
    'view_profile',
  ];

  if (userProfile.profile?.role === 'customer') {
    return customerPermissions.includes(permission);
  }

  return false;
}

// Get user's full context (user + profile + permissions)
export async function getUserContext() {
  const userProfile = await getUserProfile();

  if (!userProfile) return null;

  const role = userProfile.profile?.role || 'customer';
  const isAdminUser = role === 'admin';

  return {
    user: userProfile.user,
    profile: userProfile.profile,
    role,
    isAdmin: isAdminUser,
    permissions: {
      canViewOrders: await hasPermission('view_orders'),
      canCreateOrders: await hasPermission('create_orders'),
      canUpdateProfile: await hasPermission('update_profile'),
      canViewProfile: await hasPermission('view_profile'),
      canAccessAdmin: isAdminUser,
    },
  };
}

// Refresh user session
export async function refreshSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    logSecurityEvent('SESSION_REFRESH_ERROR', { error: error.message });
    throw error;
  }

  return data;
}

// Get session info
export async function getSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    logSecurityEvent('SESSION_FETCH_ERROR', { error: error.message });
  }

  return { session: data.session, error };
}
