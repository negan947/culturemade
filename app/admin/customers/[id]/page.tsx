import { Metadata } from 'next';

import { CustomerDetail } from '@/components/admin/customers/CustomerDetail';
import { requireAdmin } from '@/lib/supabase/auth';

export const metadata: Metadata = {
  title: 'Customer Details - CultureMade Admin',
  description: 'View and manage customer account details, order history, and profile information',
};

interface CustomerDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <CustomerDetail customerId={params.id} />
    </div>
  );
}