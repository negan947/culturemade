import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminTest() {
  // This will redirect to login if not authenticated or not admin
  const user = await requireAdmin();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🔑 Admin Access Test</h1>
      
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Admin Access Successful</h2>
        <p className="text-green-700 mb-4">
          You have successfully accessed the admin test page. This confirms that:
        </p>
        <ul className="list-disc list-inside text-green-700 space-y-1">
          <li>You are authenticated</li>
          <li>You have admin role privileges</li>
          <li>The admin middleware is working correctly</li>
          <li>Role-based access control is functioning</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Admin User Details</h3>
        <div className="text-blue-700">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-6">
        <a 
          href="/test-auth" 
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ← Back to Auth Test Suite
        </a>
      </div>
    </div>
  );
} 