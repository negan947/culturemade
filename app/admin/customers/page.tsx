import { requireAdmin } from '@/lib/supabase/auth';

export default async function AdminCustomers() {
  await requireAdmin();

  return (
    <div className='space-y-4 lg:space-y-6'>
      <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
        Customers
      </h1>

      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4 lg:p-6'>
        <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
          Customer management interface coming soon. This will include:
        </p>
        <ul className='mt-4 space-y-2 text-admin-light-text-secondary dark:text-admin-text-secondary'>
          <li>• Customer list with search</li>
          <li>• Customer profiles and order history</li>
          <li>• Account management tools</li>
          <li>• Support ticket integration</li>
          <li>• Customer analytics and insights</li>
        </ul>
      </div>
    </div>
  );
}
