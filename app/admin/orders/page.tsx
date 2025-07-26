import { requireAdmin } from '@/lib/supabase/auth';

export default async function AdminOrders() {
  await requireAdmin();

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
        Orders
      </h1>

      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6'>
        <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
          Order management interface coming soon. This will include:
        </p>
        <ul className='mt-4 space-y-2 text-admin-light-text-secondary dark:text-admin-text-secondary'>
          <li>• Order list with status filtering</li>
          <li>• Order details and tracking</li>
          <li>• Status updates and fulfillment</li>
          <li>• Customer communication</li>
          <li>• Refund and return processing</li>
        </ul>
      </div>
    </div>
  );
}
