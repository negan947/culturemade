'use client';

import { ArrowLeft, Loader2, MapPin, Package, Receipt, ShieldCheck, Truck } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAddToCart } from '@/hooks/useAddToCart';
import { getCartSessionId } from '@/utils/cartSync';

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

type OrderDetail = {
  id: string;
  order_number: string;
  email: string | null;
  phone: string | null;
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
  metadata?: any;
  items: OrderItem[];
  shipments?: Array<{
    id: string;
    tracking_number: string | null;
    carrier: string | null;
    status: 'pending' | 'in_transit' | 'delivered' | 'returned' | null;
    shipped_at: string | null;
    delivered_at: string | null;
  }> | null;
};

type OrderDetailResponse = { success: boolean; order?: OrderDetail; error?: string };

export interface OrderDetailProps {
  orderId: string;
  onBack?: () => void;
  userId?: string;
}

export default function OrderDetail({ orderId, onBack, userId }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const sessionIdRef = useRef<string | undefined>(undefined);
  if (!userId && !sessionIdRef.current && typeof window !== 'undefined') {
    sessionIdRef.current = getCartSessionId();
  }

  const { addToCart } = useAddToCart({
    userId,
    sessionId: userId ? undefined : sessionIdRef.current,
    showNotifications: true,
  });

  const formatPrice = useCallback((amount: number, currency = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount || 0));
    } catch {
      return `$${(amount || 0).toFixed(2)}`;
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load order');
      const data: OrderDetailResponse = await res.json();
      if (!data.success || !data.order) throw new Error('Order not found');
      setOrder(data.order);
    } catch (e: any) {
      setError(e?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    if (!order) return null;
    return [
      { label: 'Subtotal', value: order.subtotal },
      { label: 'Tax', value: order.tax_amount },
      { label: 'Shipping', value: order.shipping_amount },
      ...(order.discount_amount ? [{ label: 'Discount', value: -Math.abs(order.discount_amount) }] : []),
    ];
  }, [order]);

  const handleReorder = useCallback(async () => {
    if (!order) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        if (!item.variant_id) continue;
        const ok = await addToCart({
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
        });
        if (!ok) throw new Error('Failed to add one or more items');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openCart'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReordering(false);
    }
  }, [order, addToCart]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
        {onBack && (
          <button onClick={onBack} aria-label="Back" title="Back" className="p-1 -ml-1 rounded-md hover:bg-gray-100 active:bg-gray-200">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">Order</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        ) : !order ? null : (
          <div className="p-4 space-y-4">
            {/* Summary Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Order number</div>
                  <div className="font-semibold text-gray-900">{order.order_number}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-semibold text-gray-900">{formatPrice(order.total_amount, order.currency)}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Placed on {new Date(order.created_at).toLocaleString()}</div>
            </div>

            {/* Items */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-semibold text-gray-900 mb-3 flex items-center"><Package className="h-4 w-4 mr-2" /> Items</div>
              <div className="space-y-3">
                {order.items.map((it) => (
                  <div key={it.id} className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{it.product_name}</div>
                      {it.variant_name && (
                        <div className="text-xs text-gray-500">{it.variant_name}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Qty {it.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{formatPrice(it.subtotal, order.currency)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t pt-3 space-y-1">
                {totals?.map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm text-gray-700">
                    <div>{row.label}</div>
                    <div>{formatPrice(row.value, order.currency)}</div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-base font-semibold text-gray-900 mt-1">
                  <div>Total</div>
                  <div>{formatPrice(order.total_amount, order.currency)}</div>
                </div>
              </div>
            </div>

            {/* Addresses (from metadata if present) */}
            {(order.metadata?.shipping_address || order.metadata?.billing_address) && (
              <div className="grid grid-cols-1 gap-4">
                {order.metadata?.shipping_address && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center"><MapPin className="h-4 w-4 mr-2" /> Shipping Address</div>
                    <AddressBlock address={order.metadata.shipping_address} />
                  </div>
                )}
                {order.metadata?.billing_address && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center"><Receipt className="h-4 w-4 mr-2" /> Billing Address</div>
                    <AddressBlock address={order.metadata.billing_address} />
                  </div>
                )}
              </div>
            )}

            {/* Shipments / Tracking */}
            {order.shipments && order.shipments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Truck className="h-4 w-4 mr-2" /> Shipment Tracking
                </div>
                <div className="space-y-3">
                  {order.shipments.map((s) => (
                    <div key={s.id} className="flex items-start justify-between">
                      <div className="text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{s.carrier || 'Carrier'}</div>
                        {s.tracking_number && (
                          <div className="text-xs text-blue-600">
                            <a
                              href={`https://track.aftership.com/${encodeURIComponent(s.carrier || '')}/${encodeURIComponent(s.tracking_number)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {s.tracking_number}
                            </a>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {s.status || 'pending'}
                          {s.shipped_at && ` • Shipped ${new Date(s.shipped_at).toLocaleDateString()}`}
                          {s.delivered_at && ` • Delivered ${new Date(s.delivered_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support / Reorder */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-700"><ShieldCheck className="h-4 w-4 mr-2" /> Need help with this order?</div>
                <a href="mailto:support@culturemade.store" className="text-blue-600 text-sm font-medium">Contact Support</a>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleReorder}
                  className="w-full py-2 rounded-lg bg-gray-900 text-white font-medium disabled:opacity-70"
                  disabled={reordering}
                >
                  {reordering ? 'Reordering…' : 'Reorder Items'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddressBlock({ address }: { address: any }) {
  const lines: string[] = [];
  const fullName = [address?.first_name, address?.last_name].filter(Boolean).join(' ');
  if (fullName) lines.push(fullName);
  if (address?.company) lines.push(address.company);
  lines.push(String(address?.address_line_1 || ''));
  if (address?.address_line_2) lines.push(address.address_line_2);
  lines.push([address?.city, address?.state_province, address?.postal_code].filter(Boolean).join(', '));
  if (address?.country_code) lines.push(address.country_code);
  if (address?.phone) lines.push(address.phone);
  return (
    <div className="text-sm text-gray-700 space-y-0.5">
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}


