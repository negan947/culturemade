import React, { Suspense } from 'react';

import { requireAdmin } from '@/lib/supabase/auth';
import { AnalyticsDashboard } from '@/components/admin/analytics/AnalyticsDashboard';
import { AnalyticsLoadingSkeleton } from '@/components/admin/analytics/AnalyticsLoadingSkeleton';

export default async function AdminAnalytics() {
  await requireAdmin();

  return (
    <div className='space-y-4 lg:space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
            Analytics & Reports
          </h1>
          <p className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary mt-1'>
            Comprehensive insights into your business performance
          </p>
        </div>
      </div>

      <Suspense fallback={<AnalyticsLoadingSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
