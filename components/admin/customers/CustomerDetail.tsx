'use client';

import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag, DollarSign, MapPin, Edit2, Save, X, AlertCircle, RefreshCw } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { CustomerDetail as CustomerDetailType } from '@/app/api/admin/customers/[id]/route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CustomerDetailSkeleton } from './CustomerDetailSkeleton';


interface CustomerDetailProps {
  customerId: string;
}

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<CustomerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    role: ''
  });

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer');
      }

      setCustomer(data);
      setEditForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        role: data.role || 'customer'
      });
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to fetch customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customer) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editForm,
          old_values: {
            full_name: customer.full_name,
            phone: customer.phone,
            role: customer.role
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      // Refresh customer data
      await fetchCustomer();
      setEditing(false);
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!customer) return;
    
    setEditForm({
      full_name: customer.full_name || '',
      phone: customer.phone || '',
      role: customer.role || 'customer'
    });
    setEditing(false);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  const getStatusBadge = (status: CustomerDetailType['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };

    return (
      <Badge className={variants[role as keyof typeof variants] || variants.customer}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <CustomerDetailSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-2">
            Error Loading Customer
          </h3>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-4 text-center">
            {error}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <Button onClick={fetchCustomer} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <User className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-2">
            Customer Not Found
          </h3>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-4">
            The customer you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-admin-light-text-primary dark:text-admin-text-primary">
              {customer.full_name || 'Customer Details'}
            </h1>
            <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
              Customer ID: {customer.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button onClick={handleCancel} variant="outline" disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Personal details and account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-admin-light-bg-surface dark:bg-admin-bg-surface flex items-center justify-center">
                  <User className="h-8 w-8 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
                    {customer.full_name || 'No Name Provided'}
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(customer.role)}
                    {getStatusBadge(customer.status)}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                    Full Name
                  </label>
                  {editing ? (
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  ) : (
                    <div className="text-admin-light-text-primary dark:text-admin-text-primary">
                      {customer.full_name || 'Not provided'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                    <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                      {customer.email}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                    Phone
                  </label>
                  {editing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                      <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                        {customer.phone || 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                    Role
                  </label>
                  {editing ? (
                    <Select
                      value={editForm.role}
                      onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>
                      {getRoleBadge(customer.role)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                    Registered
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                    <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                      {formatDate(customer.registered_at)}
                    </span>
                  </div>
                </div>

                {customer.updated_at && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                      Last Updated
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                      <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                        {formatDate(customer.updated_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest orders from this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.recent_orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                    No Orders Yet
                  </h3>
                  <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                    This customer hasn&apos;t placed any orders yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customer.recent_orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-admin-light-border dark:border-admin-border rounded-lg hover:bg-admin-light-bg-hover dark:bg-admin-bg-hover cursor-pointer"
                      onClick={() => window.location.href = `/admin/orders/${order.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-admin-light-bg-surface dark:bg-admin-bg-surface flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                        </div>
                        <div>
                          <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                            {order.order_number}
                          </div>
                          <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                            {order.item_count} item{order.item_count !== 1 ? 's' : ''} • {formatDate(order.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                          {formatCurrency(order.total_amount)}
                        </div>
                        <Badge className={
                          order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats & Addresses */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                  <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">Total Orders</span>
                </div>
                <span className="font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
                  {customer.order_count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                  <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">Total Spent</span>
                </div>
                <span className="font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
                  {formatCurrency(customer.total_spent)}
                </span>
              </div>
              {customer.last_order_date && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                    <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">Last Order</span>
                  </div>
                  <span className="text-admin-light-text-primary dark:text-admin-text-primary text-sm">
                    {formatDate(customer.last_order_date)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>
                Saved billing and shipping addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.addresses.length === 0 ? (
                <div className="text-center py-6">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
                    No addresses saved
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customer.addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-3 border border-admin-light-border dark:border-admin-border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={address.type === 'billing' ? 'default' : 'secondary'}>
                          {address.type}
                        </Badge>
                        {address.is_default && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                          {address.first_name} {address.last_name}
                        </div>
                        {address.company && (
                          <div className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                            {address.company}
                          </div>
                        )}
                        <div className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                          {address.address_line_1}
                        </div>
                        {address.address_line_2 && (
                          <div className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                            {address.address_line_2}
                          </div>
                        )}
                        <div className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                          {address.city}, {address.state} {address.postal_code}
                        </div>
                        <div className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                          {address.country}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}