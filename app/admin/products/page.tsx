import { requireAdmin } from '@/lib/supabase/auth';

export default async function AdminProducts() {
  await requireAdmin();

  return (
    <div className='space-y-4 lg:space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
          Products
        </h1>
        <button className='bg-admin-accent text-white px-4 py-2 rounded-lg hover:bg-admin-accent-hover shadow-admin-soft hover:shadow-admin-glow transition-all duration-200 w-full sm:w-auto'>
          Add Product
        </button>
      </div>

      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4 lg:p-6'>
        <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
          Product management interface coming soon. This will include:
        </p>
        <ul className='mt-4 space-y-2 text-admin-light-text-secondary dark:text-admin-text-secondary'>
          <li>• Product list with search and filtering</li>
          <li>• Add/edit product forms</li>
          <li>• Variant management</li>
          <li>• Image upload system</li>
          <li>• Inventory management</li>
        </ul>
      </div>
    </div>
  );
}
