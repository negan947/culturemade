import { Metadata } from 'next';

import { CustomerList } from '@/components/admin/customers/CustomerList';
import { requireAdmin } from '@/lib/supabase/auth';

export const metadata: Metadata = {
  title: 'Customer Management - CultureMade Admin',
  description: 'Manage customer accounts, view customer details, and handle customer support',
};

export default async function AdminCustomers() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-admin-light-text-primary dark:text-admin-text-primary">
          Customer Management
        </h1>
        <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
          Manage customer accounts, view order history, and handle customer support requests.
        </p>
      </div>

      <CustomerList />
    </div>
  );
}
