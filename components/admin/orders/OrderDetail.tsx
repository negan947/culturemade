'use client';

import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  XCircle,
  Edit3
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  products?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  product_variants?: {
    id: string;
    size: string | null;
    color: string | null;
    sku: string | null;
  } | null;
}

interface Address {
  id: string;
  type: string;
  first_name: string;
  last_name: string;
  company: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

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
  billing_address_id: string | null;
  shipping_address_id: string | null;
  notes: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  addresses?: Address | null;
  shipping_address?: Address | null;
  items: OrderItem[];
}

interface OrderDetailProps {
  orderId: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' }
];

const FULFILLMENT_STATUS_OPTIONS = [
  { value: 'unfulfilled', label: 'Unfulfilled' },
  { value: 'partial', label: 'Partially Fulfilled' },
  { value: 'fulfilled', label: 'Fulfilled' }
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

export function OrderDetail({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data.order);
      setStatus(data.order.status);
      setFulfillmentStatus(data.order.fulfillment_status);
      setNotes(data.order.notes || '');

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (updates: any) => {
    try {
      setUpdating(true);

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      const data = await response.json();
      setOrder(data.order);
      setEditingNotes(false);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    await updateOrder({
      status,
      fulfillment_status: fulfillmentStatus
    });
  };

  const handleNotesUpdate = async () => {
    await updateOrder({ notes });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: Address | null) => {
    if (!address) return 'No address provided';

    const parts = [
      `${address.first_name} ${address.last_name}`,
      address.company,
      address.address_line_1,
      address.address_line_2,
      `${address.city}, ${address.state} ${address.postal_code}`,
      address.country
    ].filter(Boolean);

    return parts.join('\n');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded w-1/4"></div>
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
            Error Loading Order
          </h3>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-4">
            {error}
          </p>
          <Button onClick={fetchOrder} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="text-center">
          <Package className="h-12 w-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
          <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
            Order Not Found
          </h3>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
            The requested order could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-admin-light-text-primary dark:text-admin-text-primary mb-2">
              Order {order.order_number}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(order.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                {formatCurrency(order.total_amount, order.currency)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusIcon(order.status)}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled" />
              <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                {order.profiles?.full_name || 'Guest Customer'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled" />
              <a 
                href={`mailto:${order.email}`}
                className="text-admin-accent hover:text-admin-accent-hover transition-colors duration-200"
              >
                {order.email}
              </a>
            </div>
            {order.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled" />
                <a 
                  href={`tel:${order.phone}`}
                  className="text-admin-accent hover:text-admin-accent-hover transition-colors duration-200"
                >
                  {order.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Management */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Status Management
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border dark:border-admin-border rounded-lg px-3 py-2 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-transparent"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                Fulfillment Status
              </label>
              <select
                value={fulfillmentStatus}
                onChange={(e) => setFulfillmentStatus(e.target.value)}
                className="w-full bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border dark:border-admin-border rounded-lg px-3 py-2 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-transparent"
              >
                {FULFILLMENT_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={updating || (status === order.status && fulfillmentStatus === order.fulfillment_status)}
              className="w-full"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Address */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Billing Address
          </h3>
          <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary whitespace-pre-line">
            {formatAddress(order.addresses || null)}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </h3>
          <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary whitespace-pre-line">
            {formatAddress(order.shipping_address || order.addresses || null)}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border overflow-hidden">
        <div className="p-6 border-b border-admin-light-border dark:border-admin-border">
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items ({order.items.length})
          </h3>
        </div>

        <div className="divide-y divide-admin-light-border dark:divide-admin-border">
          {order.items.map((item) => (
            <div key={item.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                    {item.product_name}
                  </h4>
                  {item.variant_name && (
                    <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                      {item.variant_name}
                    </p>
                  )}
                  {item.product_variants && (
                    <div className="flex gap-4 text-xs text-admin-light-text-disabled dark:text-admin-text-disabled mt-1">
                      {item.product_variants.size && (
                        <span>Size: {item.product_variants.size}</span>
                      )}
                      {item.product_variants.color && (
                        <span>Color: {item.product_variants.color}</span>
                      )}
                      {item.product_variants.sku && (
                        <span>SKU: {item.product_variants.sku}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                    {formatCurrency(item.price)} × {item.quantity}
                  </div>
                  <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-admin-light-bg-hover dark:bg-admin-bg-hover p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">Subtotal</span>
              <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            {order.tax_amount && order.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">Tax</span>
                <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                  {formatCurrency(order.tax_amount)}
                </span>
              </div>
            )}
            {order.shipping_amount && order.shipping_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">Shipping</span>
                <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                  {formatCurrency(order.shipping_amount)}
                </span>
              </div>
            )}
            {order.discount_amount && order.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">Discount</span>
                <span className="text-green-600 dark:text-green-400">
                  -{formatCurrency(order.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold pt-2 border-t border-admin-light-border dark:border-admin-border">
              <span className="text-admin-light-text-primary dark:text-admin-text-primary">Total</span>
              <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Order Notes
          </h3>
          {!editingNotes && (
            <Button
              onClick={() => setEditingNotes(true)}
              variant="outline"
              size="sm"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {editingNotes ? (
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this order..."
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleNotesUpdate}
                disabled={updating}
                size="sm"
              >
                {updating ? 'Saving...' : 'Save Notes'}
              </Button>
              <Button
                onClick={() => {
                  setEditingNotes(false);
                  setNotes(order.notes || '');
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-admin-light-text-secondary dark:text-admin-text-secondary">
            {order.notes || (
              <span className="italic text-admin-light-text-disabled dark:text-admin-text-disabled">
                No notes added for this order
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}