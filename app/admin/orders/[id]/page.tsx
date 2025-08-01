import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { OrderDetail } from '@/components/admin/orders/OrderDetail';
import { OrderDetailSkeleton } from '@/components/admin/orders/OrderDetailSkeleton';
import { requireAdmin } from '@/lib/supabase/auth';

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  await requireAdmin();

  const { id } = params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  return (
    <div className='space-y-4 lg:space-y-6'>
      {/* Header with Back Button */}
      <div className='flex items-center gap-4'>
        <Link
          href='/admin/orders'
          className='inline-flex items-center gap-2 text-sm text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Orders
        </Link>
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
            Order Details
          </h1>
          <p className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary mt-1'>
            View and manage order information
          </p>
        </div>
      </div>

      {/* Order Detail */}
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetail orderId={id} />
      </Suspense>
    </div>
  );
}