import {
  AlertCircle,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockProducts: number;
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // Get product counts
  const { data: productStats } = await supabase
    .from('products')
    .select('status');

  const totalProducts = productStats?.length || 0;
  const activeProducts =
    productStats?.filter((p) => p.status === 'active').length || 0;

  // Get order count
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  // Get customer count
  const { count: totalCustomers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer');

  // Get revenue (sum of completed orders)
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'completed');

  const totalRevenue =
    revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) ||
    0;

  // Get low stock products (products with variants having stock < 10)
  const { data: lowStockData } = await supabase
    .from('product_variants')
    .select('product_id')
    .lt('quantity', 10);

  const lowStockProducts = new Set(lowStockData?.map((v) => v.product_id) || [])
    .size;

  return {
    totalProducts,
    activeProducts,
    totalOrders: totalOrders || 0,
    totalCustomers: totalCustomers || 0,
    totalRevenue,
    lowStockProducts,
  };
}

export default async function AdminDashboard() {
  // Ensure user is admin
  await requireAdmin();

  // Get dashboard statistics
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      subtitle: `${stats.activeProducts} active`,
      icon: Package,
      color: 'bg-admin-accent',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      subtitle: 'All time',
      icon: ShoppingCart,
      color: 'bg-admin-success',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      subtitle: 'Registered users',
      icon: Users,
      color: 'bg-admin-accent-subtle',
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: 'Total completed',
      icon: DollarSign,
      color: 'bg-admin-warning',
    },
  ];

  const alertCards = [
    {
      title: 'Low Stock Alert',
      value: stats.lowStockProducts,
      subtitle: 'Products need restocking',
      icon: AlertCircle,
      color:
        stats.lowStockProducts > 0
          ? 'bg-admin-error'
          : 'bg-admin-text-disabled',
      urgent: stats.lowStockProducts > 0,
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Welcome Header */}
      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4 lg:p-6'>
        <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary mb-2'>
          Welcome to CultureMade Admin
        </h1>
        <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
          Manage your e-commerce platform with comprehensive tools and insights.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4 lg:p-6 hover:shadow-admin-popover transition-shadow duration-200'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1'>
                    {stat.title}
                  </p>
                  <p className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
                    {stat.value}
                  </p>
                  <p className='text-xs text-admin-light-text-disabled dark:text-admin-text-disabled'>
                    {stat.subtitle}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${stat.color} shadow-admin-soft`}
                >
                  <Icon className='h-6 w-6 text-white' />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'>
        {alertCards.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.title}
              className={`bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4 lg:p-6 hover:shadow-admin-popover transition-shadow duration-200 ${alert.urgent ? 'border-l-4 border-admin-error' : ''}`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1'>
                    {alert.title}
                  </p>
                  <p className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
                    {alert.value}
                  </p>
                  <p className='text-xs text-admin-light-text-disabled dark:text-admin-text-disabled'>
                    {alert.subtitle}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${alert.color} shadow-admin-soft`}
                >
                  <Icon className='h-6 w-6 text-white' />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4 lg:p-6'>
        <h2 className='text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4'>
          Quick Actions
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          <Link
            href='/admin/products/new'
            className='flex items-center p-3 lg:p-4 border border-admin-light-border dark:border-admin-border-soft rounded-lg hover:border-admin-accent hover:bg-admin-light-accent-bg dark:hover:bg-admin-bg-hover hover:shadow-admin-glow dark:hover:shadow-admin-glow transition-all duration-200'
          >
            <Package className='h-6 w-6 lg:h-8 lg:w-8 text-admin-accent mr-3' />
            <div>
              <p className='font-medium text-admin-light-text-primary dark:text-admin-text-primary'>
                Add New Product
              </p>
              <p className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary'>
                Create a new product listing
              </p>
            </div>
          </Link>

          <Link
            href='/admin/orders'
            className='flex items-center p-3 lg:p-4 border border-admin-light-border dark:border-admin-border-soft rounded-lg hover:border-admin-success hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover hover:shadow-admin-soft transition-all duration-200'
          >
            <ShoppingCart className='h-6 w-6 lg:h-8 lg:w-8 text-admin-success mr-3' />
            <div>
              <p className='font-medium text-admin-light-text-primary dark:text-admin-text-primary'>
                View Orders
              </p>
              <p className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary'>
                Manage customer orders
              </p>
            </div>
          </Link>

          <a
            href='/admin/analytics'
            className='flex items-center p-3 lg:p-4 border border-admin-light-border dark:border-admin-border-soft rounded-lg hover:border-admin-warning hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover hover:shadow-admin-soft transition-all duration-200'
          >
            <TrendingUp className='h-6 w-6 lg:h-8 lg:w-8 text-admin-warning mr-3' />
            <div>
              <p className='font-medium text-admin-light-text-primary dark:text-admin-text-primary'>
                View Analytics
              </p>
              <p className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary'>
                Check sales performance
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* System Status */}
      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4 lg:p-6'>
        <h2 className='text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4'>
          System Status
        </h2>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary'>
              Database Connection
            </span>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-admin-success/20 text-green-800 dark:text-admin-success border border-green-200 dark:border-admin-success/30'>
              Connected
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary'>
              Payment System
            </span>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-admin-success/20 text-green-800 dark:text-admin-success border border-green-200 dark:border-admin-success/30'>
              Operational
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-admin-light-text-secondary dark:text-admin-text-secondary'>
              Image Storage
            </span>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-admin-success/20 text-green-800 dark:text-admin-success border border-green-200 dark:border-admin-success/30'>
              Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
