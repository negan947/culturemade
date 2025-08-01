import { Suspense } from 'react';

import { OrderList } from '@/components/admin/orders/OrderList';
import { OrderListSkeleton } from '@/components/admin/orders/OrderListSkeleton';
import { requireAdmin } from '@/lib/supabase/auth';

export default async function AdminOrders() {
  await requireAdmin();

  return (
    <div className='space-y-4 lg:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
            Orders
          </h1>
          <p className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary mt-1'>
            Manage customer orders and fulfillment
          </p>
        </div>
      </div>

      {/* Order List */}
      <Suspense fallback={<OrderListSkeleton />}>
        <OrderList />
      </Suspense>
    </div>
  );
}