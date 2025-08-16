'use client';

import { 
  Truck, 
  Package, 
  CheckSquare,
  Square,
  Download,
  Send,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  order_number: string;
  email: string;
  total_amount: number;
  currency: string;
  fulfillment_status: string;
  created_at: string;
  addresses?: {
    first_name: string;
    last_name: string;
    city: string;
    state_province: string;
    postal_code: string;
    country_code: string;
  } | null;
}

interface Shipment {
  id: string;
  order_id: string;
  tracking_number: string;
  carrier: string;
  service: string;
  status: string;
  cost: number;
  weight: number;
  shipped_at: string;
  created_at: string;
  orders?: {
    order_number: string;
    email: string;
    total_amount: number;
    currency: string;
  } | null;
}

const CARRIERS = [
  { value: 'UPS', label: 'UPS' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'USPS', label: 'USPS' },
  { value: 'DHL', label: 'DHL' }
];

const SERVICES = {
  UPS: ['Ground', 'Next Day Air', '2nd Day Air'],
  FedEx: ['Ground', 'Express Saver', 'Priority Overnight'],
  USPS: ['Ground Advantage', 'Priority Mail', 'Priority Mail Express'],
  DHL: ['Ground', 'Express Worldwide', 'Express 12:00']
};

export function ShippingManager() {
  const [activeTab, setActiveTab] = useState<'pending' | 'shipments'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Bulk shipping state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedCarrier, setSelectedCarrier] = useState('UPS');
  const [selectedService, setSelectedService] = useState('Ground');

  const fetchPendingOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/orders?fulfillment_status=pending&limit=50');
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    }
  }, []);

  const fetchShipments = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/shipping?action=shipments');
      if (!response.ok) throw new Error('Failed to fetch shipments');
      
      const data = await response.json();
      setShipments(data.shipments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([fetchPendingOrders(), fetchShipments()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchPendingOrders, fetchShipments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    }
  };

  const handleBulkShipping = async (action: 'generate_labels' | 'batch_process') => {
    if (selectedOrders.size === 0) return;

    try {
      setProcessing(true);
      
      const response = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          orderIds: Array.from(selectedOrders),
          carrier: selectedCarrier,
          service: selectedService
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk shipping operation failed');
      }

      const result = await response.json();
      
      // Refresh data
      await fetchData();
      setSelectedOrders(new Set());
      
      // Could show success toast/notification here
      console.log('Bulk shipping result:', result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk shipping operation failed');
    } finally {
      setProcessing(false);
    }
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-3 text-sm font-medium rounded-l-lg transition-colors duration-200 ${
              activeTab === 'pending'
                ? 'bg-admin-accent text-white'
                : 'text-admin-light-text-secondary dark:text-admin-text-secondary hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover'
            }`}
          >
            Pending Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex-1 px-6 py-3 text-sm font-medium rounded-r-lg transition-colors duration-200 ${
              activeTab === 'shipments'
                ? 'bg-admin-accent text-white'
                : 'text-admin-light-text-secondary dark:text-admin-text-secondary hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover'
            }`}
          >
            Active Shipments ({shipments.length})
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <Button onClick={() => setError(null)} variant="ghost" size="sm" className="ml-auto">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'pending' ? (
        <div className="space-y-6">
          {/* Bulk Actions */}
          {selectedOrders.size > 0 && (
            <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">
                  {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCarrier}
                    onChange={(e) => {
                      setSelectedCarrier(e.target.value);
                      setSelectedService(SERVICES[e.target.value as keyof typeof SERVICES][0]);
                    }}
                    className="bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border dark:border-admin-border rounded px-3 py-2 text-sm"
                  >
                    {CARRIERS.map(carrier => (
                      <option key={carrier.value} value={carrier.value}>
                        {carrier.label}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border dark:border-admin-border rounded px-3 py-2 text-sm"
                  >
                    {SERVICES[selectedCarrier as keyof typeof SERVICES].map(service => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBulkShipping('generate_labels')}
                    disabled={processing}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Generate Labels
                  </Button>
                  
                  <Button
                    onClick={() => handleBulkShipping('batch_process')}
                    disabled={processing}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Batch Process
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedOrders(new Set())}
                    variant="ghost"
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Orders Table */}
          <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="h-12 w-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
                <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                  No Pending Orders
                </h3>
                <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                  All orders have been processed or there are no orders to fulfill.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-admin-light-bg-hover dark:bg-admin-bg-hover">
                    <tr>
                      <th className="px-6 py-3 text-left w-12">
                        <button onClick={toggleAllOrders} className="flex items-center justify-center w-5 h-5">
                          {selectedOrders.size === orders.length && orders.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-admin-accent" />
                          ) : (
                            <Square className="h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-light-border dark:divide-admin-border">
                    {orders.map((order) => (
                      <tr 
                        key={order.id}
                        className="hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleOrderSelection(order.id)}
                            className="flex items-center justify-center w-5 h-5"
                          >
                            {selectedOrders.has(order.id) ? (
                              <CheckSquare className="h-4 w-4 text-admin-accent" />
                            ) : (
                              <Square className="h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled hover:text-admin-accent" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                            {order.order_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">
                            {order.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {formatCurrency(order.total_amount, order.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Shipments Tab */
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border overflow-hidden">
          {shipments.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="h-12 w-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                No Active Shipments
              </h3>
              <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                Shipments will appear here once orders are processed and shipped.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-admin-light-bg-hover dark:bg-admin-bg-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                      Tracking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                      Carrier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary uppercase">
                      Shipped
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-light-border dark:divide-admin-border">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                          {shipment.orders?.order_number || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">
                          {shipment.tracking_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {shipment.carrier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(shipment.status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                            {shipment.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                        {shipment.shipped_at ? formatDate(shipment.shipped_at) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}