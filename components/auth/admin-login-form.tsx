'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Shield, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setErrorMessage(authError.message);
        return;
      }

      if (authData.user) {
        // Verify admin role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          setErrorMessage('Unable to verify admin access. Please contact support.');
          return;
        }

        // Check if user has admin role
        if (profileData?.role !== 'admin' && profileData?.role !== 'super_admin') {
          // Sign out the non-admin user
          await supabase.auth.signOut();
          setErrorMessage('Access denied. Admin credentials required.');
          return;
        }

        // Success - redirect to admin dashboard
        window.location.href = '/admin';
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errorMessage && (
        <div className="flex items-start space-x-3 p-4 bg-admin-bg-surface border border-red-500 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-400">Authentication Failed</h4>
            <p className="text-sm text-red-300 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email" className="text-admin-text-primary">
            Admin Email
          </Label>
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@culturemade.com"
            {...register('email')}
            className={`bg-admin-bg-surface border-admin-border text-admin-text-primary placeholder:text-admin-text-disabled focus:border-admin-accent focus:ring-admin-accent ${
              errors.email ? 'border-red-500' : ''
            }`}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password" className="text-admin-text-primary">
            Admin Password
          </Label>
          <Input
            id="admin-password"
            type="password"
            placeholder="Enter your admin password"
            {...register('password')}
            className={`bg-admin-bg-surface border-admin-border text-admin-text-primary placeholder:text-admin-text-disabled focus:border-admin-accent focus:ring-admin-accent ${
              errors.password ? 'border-red-500' : ''
            }`}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-admin-accent hover:bg-admin-accent-hover text-white font-medium py-3 shadow-admin-glow" 
        disabled={isLoading}
      >
        <div className="flex items-center justify-center space-x-2">
          <Shield className="h-4 w-4" />
          <span>{isLoading ? 'Verifying Admin Access...' : 'Access Admin Portal'}</span>
        </div>
      </Button>

      {/* Security Footer */}
      <div className="text-center text-xs text-admin-text-disabled">
        <p>Secure admin authentication powered by Supabase</p>
        <p className="mt-1">All login attempts are logged for security</p>
      </div>
    </form>
  );
}