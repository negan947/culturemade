import { requireAuth } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export default async function AccountTest() {
  // This will redirect to login if not authenticated
  const user = await requireAuth();

  // Get user profile
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className='container mx-auto p-8'>
      <h1 className='text-3xl font-bold mb-6'>👤 Customer Account Test</h1>

      <div className='p-6 bg-green-50 border border-green-200 rounded-lg'>
        <h2 className='text-xl font-semibold text-green-800 mb-2'>
          ✅ Customer Access Successful
        </h2>
        <p className='text-green-700 mb-4'>
          You have successfully accessed the customer account test page. This
          confirms that:
        </p>
        <ul className='list-disc list-inside text-green-700 space-y-1'>
          <li>You are authenticated</li>
          <li>You can access customer protected routes</li>
          <li>The auth middleware is working correctly</li>
          <li>Customer route protection is functioning</li>
        </ul>
      </div>

      <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <h3 className='font-semibold text-blue-800 mb-2'>User Details</h3>
        <div className='text-blue-700'>
          <p>
            <strong>User ID:</strong> {user.id}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {profile?.role || 'No role'}
          </p>
          <p>
            <strong>Full Name:</strong> {profile?.full_name || 'Not set'}
          </p>
          <p>
            <strong>Created:</strong>{' '}
            {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {profile?.role === 'admin' && (
        <div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <h3 className='font-semibold text-yellow-800 mb-2'>
            ⚠️ Admin Notice
          </h3>
          <p className='text-yellow-700'>
            You are logged in as an admin but accessing a customer route. Admins
            can access all customer routes but customers cannot access admin
            routes.
          </p>
        </div>
      )}

      <div className='mt-6 flex gap-4'>
        <a
          href='/test-auth'
          className='inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          ← Back to Auth Test Suite
        </a>
        {profile?.role === 'admin' && (
          <a
            href='/admin/test'
            className='inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700'
          >
            🔑 Test Admin Access
          </a>
        )}
      </div>
    </div>
  );
}
