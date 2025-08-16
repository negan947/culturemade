import { AdminLoginForm } from '@/components/auth/admin-login-form';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen-dvh sm:min-h-screen flex items-center justify-center bg-admin-bg-main">
      <div className="w-full max-w-md px-4 py-safe-top pb-safe-bottom sm:py-0">
        <div className="space-y-6">
          {/* Admin Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-admin-accent rounded-lg flex items-center justify-center shadow-admin-glow mb-4">
              <span className="text-white font-bold text-2xl">CM</span>
            </div>
            <h1 className="text-3xl font-bold text-admin-text-primary">Admin Portal</h1>
            <p className="text-admin-text-secondary">
              Sign in to access the CultureMade admin dashboard
            </p>
          </div>

          {/* Admin Login Form */}
          <AdminLoginForm />

          {/* Security Notice */}
          <div className="bg-admin-bg-surface border border-admin-border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-admin-warning" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-admin-text-primary">
                  Admin Access Only
                </h3>
                <p className="text-sm text-admin-text-secondary mt-1">
                  This portal is restricted to authorized administrators only. 
                  All access attempts are logged and monitored.
                </p>
              </div>
            </div>
          </div>

          {/* Customer Redirect */}
          <div className="text-center">
            <p className="text-sm text-admin-text-disabled">
              Looking to shop? 
              <a 
                href="/" 
                className="text-admin-accent hover:text-admin-accent-hover ml-1 font-medium"
              >
                Visit our store →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}