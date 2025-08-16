import Link from 'next/link';
import { Smartphone, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className='space-y-8'>
      {/* Customer Login Redirect */}
      <div className='text-center space-y-4'>
        <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
          <Smartphone className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className='text-3xl font-bold'>Customer Sign In</h1>
        <p className='text-muted-foreground max-w-md mx-auto'>
          Customer accounts are managed through our iPhone interface. 
          Click below to access the shopping experience and sign in.
        </p>
      </div>

      {/* Main CTA */}
      <div className="space-y-4">
        <Link 
          href="/" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-medium flex items-center justify-center space-x-3 transition-colors"
        >
          <Smartphone className="h-5 w-5" />
          <span>Go to iPhone Shopping Interface</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
        
        <p className="text-center text-sm text-muted-foreground">
          Once there, tap the <strong>Profile</strong> tab to sign in or create your account
        </p>
      </div>

      {/* Admin Access */}
      <div className="border-t pt-8">
        <div className="bg-gray-50 rounded-lg p-6 text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="h-8 w-8 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Administrator Access</h3>
            <p className="text-sm text-gray-600 mt-1">
              Admin users have a dedicated portal for store management
            </p>
          </div>
          <Link 
            href="/admin/login" 
            className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            Access Admin Portal
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Other Auth Links */}
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
