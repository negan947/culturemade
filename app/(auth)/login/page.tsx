import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold'>Welcome back</h1>
        <p className='text-muted-foreground'>
          Sign in to your account to continue shopping
        </p>
      </div>

      <LoginForm />

      <div className='space-y-4 text-center text-sm'>
        <div>
          <Link href='/reset-password' className='text-primary hover:underline'>
            Forgot your password?
          </Link>
        </div>

        <div className='text-muted-foreground'>
          Don&apos;t have an account?{' '}
          <Link
            href='/register'
            className='text-primary hover:underline font-medium'
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
