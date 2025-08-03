'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function RegisterForm({
  onSuccess,
  redirectTo = '/',
}: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Note: Profile creation is handled automatically by database trigger
  // The handle_new_user() trigger function creates the profile when auth.users record is inserted

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Step 1: Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        setErrorMessage(authError.message);
        return;
      }

      if (!authData.user) {
        setErrorMessage('Failed to create user account. Please try again.');
        return;
      }

      // Step 2: Handle success (profile creation handled by database trigger)
      if (authData.user.email_confirmed_at) {
        // User is automatically confirmed (development mode)
        setSuccessMessage('Account created successfully! You can now sign in.');

        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        } else {
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 1500);
        }
      } else {
        // User needs to confirm email
        setSuccessMessage(
          'Account created successfully! Please check your email to verify your account before signing in.'
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      {/* Add register form here */}
    </div>
  );
}
