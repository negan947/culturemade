'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import {
  ResetPasswordForm,
  UpdatePasswordForm,
} from '@/components/auth/reset-password-form';

export default function ResetPasswordPage() {
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // Check if we have recovery token in URL (from email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      setIsRecoveryMode(true);
    }
  }, []);

  if (isRecoveryMode) {
    return (
      <div className='space-y-6'>
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold'>Update your password</h1>
          <p className='text-muted-foreground'>Enter your new password below</p>
        </div>

        <UpdatePasswordForm redirectTo='/login' />

        <div className='text-center text-sm text-muted-foreground'>
          Remember your password?{' '}
          <Link
            href='/login'
            className='text-primary hover:underline font-medium'
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold'>Reset your password</h1>
        <p className='text-muted-foreground'>
          Enter your email and we&apos;ll send you instructions to reset your
          password
        </p>
      </div>

      <ResetPasswordForm />

      <div className='text-center text-sm text-muted-foreground'>
        Remember your password?{' '}
        <Link
          href='/login'
          className='text-primary hover:underline font-medium'
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
