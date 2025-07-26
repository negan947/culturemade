import Link from 'next/link';

import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold'>Create an account</h1>
        <p className='text-muted-foreground'>
          Join CultureMade to start shopping
        </p>
      </div>

      <RegisterForm />

      <div className='text-center text-sm text-muted-foreground'>
        Already have an account?{' '}
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
