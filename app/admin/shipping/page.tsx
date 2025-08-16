import { Suspense } from 'react';

import { ShippingManager } from '@/components/admin/shipping/ShippingManager';
import { ShippingManagerSkeleton } from '@/components/admin/shipping/ShippingManagerSkeleton';
import { requireAdmin } from '@/lib/supabase/auth';

export default async function AdminShippingPage() {
  await requireAdmin();

  return (
    <div className='space-y-4 lg:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
            Shipping Management
          </h1>
          <p className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary mt-1'>
            Generate shipping labels, track packages, and manage fulfillment
          </p>
        </div>
      </div>

      {/* Shipping Manager */}
      <Suspense fallback={<ShippingManagerSkeleton />}>
        <ShippingManager />
      </Suspense>
    </div>
  );
}