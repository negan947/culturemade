'use client';

import { 
  Search, 
  Filter, 
  ChevronDown, 
  ExternalLink,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  tax_amount: number | null;
  shipping_amount: number | null;
  discount_amount: number | null;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
  } | null;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' }
];

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest First' },
  { value: 'created_at:asc', label: 'Oldest First' },
  { value: 'total_amount:desc', label: 'Highest Amount' },
  { value: 'total_amount:asc', label: 'Lowest Amount' },
  { value: 'order_number:asc', label: 'Order Number A-Z' },
  { value: 'order_number:desc', label: 'Order Number Z-A' }
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'processing':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'shipped':
      return <Truck className="h-4 w-4 text-purple-500" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'refunded':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'processing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'shipped':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'delivered':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'refunded':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at:desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(status !== 'all' && { status }),
        ...(search && { search }),
        ...(sortBy && { 
          sortBy: sortBy.split(':')[0],
          sortOrder: sortBy.split(':')[1]
        })
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);

    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [page, status, search, sortBy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [status, search, sortBy]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
            Error Loading Orders
          </h3>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-4">
            {error}
          </p>
          <Button onClick={fetchOrders} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled" />
              <input
                type="text"
                placeholder="Search by order number, email, or customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border dark:border-admin-border rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border dark:border-admin-border rounded-lg px-4 py-2 pr-8 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-transparent"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border dark:border-admin-border rounded-lg px-4 py-2 pr-8 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-transparent"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
            <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
              No orders found
            </h3>
            <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
              {search || status !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Orders will appear here once customers start purchasing'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-admin-light-bg-hover dark:bg-admin-bg-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-light-border dark:divide-admin-border">
                  {orders.map((order) => (
                    <tr 
                      key={order.id}
                      className="hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                            {order.order_number}
                          </div>
                          <div className="text-xs text-admin-light-text-secondary dark:text-admin-text-secondary">
                            ID: {order.id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                            {order.profiles?.full_name || 'Guest Customer'}
                          </div>
                          <div className="text-xs text-admin-light-text-secondary dark:text-admin-text-secondary">
                            {order.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                        {formatCurrency(order.total_amount, order.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-admin-accent hover:text-admin-accent-hover transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-admin-light-border dark:divide-admin-border">
              {orders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                        {order.order_number}
                      </div>
                      <div className="text-xs text-admin-light-text-secondary dark:text-admin-text-secondary">
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                      {formatCurrency(order.total_amount, order.currency)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">
                        {order.profiles?.full_name || 'Guest Customer'}
                      </div>
                      <div className="text-xs text-admin-light-text-secondary dark:text-admin-text-secondary">
                        {order.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-sm text-admin-accent hover:text-admin-accent-hover transition-colors duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}