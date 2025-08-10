'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Loader2, Package, RefreshCw, Search, X } from 'lucide-react';

import { getCartSessionId } from '@/utils/cartSync';
import { useAddToCart } from '@/hooks/useAddToCart';

type OrderListItem = {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled' | 'returned' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  price: number;
  quantity: number;
  subtotal: number;
};

type OrderDetailResponse = {
  success: boolean;
  order?: {
    id: string;
    order_number: string;
    items: OrderItem[];
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    currency: string;
    metadata?: any;
  };
  error?: string;
};

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrderHistoryResponse {
  success: boolean;
  orders: OrderListItem[];
  pagination: Pagination;
}

export interface OrderHistoryProps {
  onBack?: () => void;
  onSelectOrder?: (orderId: string) => void;
  userId?: string;
}

export default function OrderHistory({ onBack, onSelectOrder, userId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const sessionIdRef = useRef<string | undefined>(undefined);
  if (!userId && !sessionIdRef.current && typeof window !== 'undefined') {
    sessionIdRef.current = getCartSessionId();
  }

  const { addToCart, isLoading: addToCartLoading } = useAddToCart({
    userId,
    sessionId: userId ? undefined : sessionIdRef.current,
    showNotifications: true,
  });

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      o.order_number.toLowerCase().includes(q)
    );
  }, [orders, query]);

  const formatPrice = useCallback((amount: number, currency = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount || 0));
    } catch {
      return `$${(amount || 0).toFixed(2)}`;
    }
  }, []);

  const loadOrders = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const res = await fetch(`/api/orders?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load orders');
      const data: OrderHistoryResponse = await res.json();
      if (!data.success) throw new Error('Failed to load orders');

      setOrders((prev) => (page === 1 ? data.orders : [...prev, ...data.orders]));
      setPagination(data.pagination);
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  const renderStatusBadge = (order: OrderListItem) => {
    const status = order.status;
    const color =
      status === 'delivered' ? 'bg-green-100 text-green-700 border-green-200'
      : status === 'shipped' ? 'bg-blue-100 text-blue-700 border-blue-200'
      : status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${color}`}>{status}</span>
    );
  };

  const reorder = useCallback(async (orderId: string) => {
    setReorderingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to load order');
      const data: OrderDetailResponse = await res.json();
      if (!data.success || !data.order) throw new Error('Order not found');

      // Add each item to cart sequentially to avoid race conditions
      for (const item of data.order.items) {
        if (!item.variant_id) continue;
        const ok = await addToCart({
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
        });
        if (!ok) throw new Error('Failed to add one or more items');
      }

      // Open cart drawer to review
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openCart'));
      }
    } catch (e) {
      // Errors are already surfaced via notifications in addToCart
      console.error(e);
    } finally {
      setReorderingId(null);
    }
  }, [addToCart]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button onClick={onBack} aria-label="Back" title="Back" className="p-1 -ml-1 rounded-md hover:bg-gray-100 active:bg-gray-200">
              <X className="h-6 w-6 text-gray-700" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by order number"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && orders.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <div className="font-medium">No orders found</div>
            <div className="text-sm">You haven't placed any orders yet.</div>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => onSelectOrder?.(order.id)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{order.order_number}</div>
                  {renderStatusBadge(order)}
                </div>
                <div className="mt-1 text-xs text-gray-500 flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-gray-700">Total</div>
                  <div className="text-base font-semibold text-gray-900">{formatPrice(order.total_amount, order.currency)}</div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); reorder(order.id); }}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={reorderingId === order.id || addToCartLoading}
                  >
                    {reorderingId === order.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Reorder
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.page < pagination.totalPages && (
        <div className="bg-white border-t border-gray-200 p-3">
          <button
            onClick={() => loadOrders((pagination?.page || 1) + 1)}
            className="w-full py-2 rounded-lg bg-gray-900 text-white font-medium disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}


