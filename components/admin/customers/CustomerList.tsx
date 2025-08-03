'use client';

import { Search, Filter, User, Mail, Phone, Calendar, ShoppingBag, DollarSign, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { CustomerListItem, CustomerListResponse } from '@/app/api/admin/customers/route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CustomerListSkeleton } from './CustomerListSkeleton';


interface CustomerListProps {
  initialPage?: number;
  initialSearch?: string;
  initialRole?: string;
  initialStatus?: string;
}

export function CustomerList({
  initialPage = 1,
  initialSearch = '',
  initialRole = 'all',
  initialStatus = 'all'
}: CustomerListProps) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(role !== 'all' && { role }),
        ...(status !== 'all' && { status })
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to fetch customers');
      }

      const data: CustomerListResponse = await response.json();

      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  };

  const handleRoleFilter = (value: string) => {
    setRole(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchCustomers();
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: CustomerListItem['status']) => {
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
    return <CustomerListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-2">
            Error Loading Customers
          </h3>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-4 text-center">
            {error}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter Customers
          </CardTitle>
          <CardDescription>
            Find customers by name, email, or phone number and filter by role or status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={role} onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Customers ({pagination.total})
          </CardTitle>
          <CardDescription>
            Showing {customers.length} of {pagination.total} customers
            {pagination.totalPages > 1 && ` (Page ${pagination.page} of ${pagination.totalPages})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                No Customers Found
              </h3>
              <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                {search || role !== 'all' || status !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No customers have been registered yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-admin-light-border dark:border-admin-border">
                        <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                          Contact
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                          Role & Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                          Orders
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                          Total Spent
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                          Registered
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b border-admin-light-border dark:border-admin-border hover:bg-admin-light-bg-hover dark:bg-admin-bg-hover cursor-pointer"
                          onClick={() => window.location.href = `/admin/customers/${customer.id}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-admin-light-bg-surface dark:bg-admin-bg-surface flex items-center justify-center">
                                <User className="h-5 w-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                              </div>
                              <div>
                                <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                                  {customer.full_name || 'No Name'}
                                </div>
                                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                                  ID: {customer.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                                <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                                  {customer.email}
                                </span>
                              </div>
                              {customer.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                                  <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                                    {customer.phone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-2">
                              {getRoleBadge(customer.role)}
                              {getStatusBadge(customer.status)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                              <span className="text-admin-light-text-primary dark:text-admin-text-primary font-medium">
                                {customer.order_count}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                              <span className="text-admin-light-text-primary dark:text-admin-text-primary font-medium">
                                {formatCurrency(customer.total_spent)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                              <Calendar className="h-4 w-4" />
                              {formatDate(customer.registered_at)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {customers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => window.location.href = `/admin/customers/${customer.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-admin-light-bg-surface dark:bg-admin-bg-surface flex items-center justify-center">
                            <User className="h-6 w-6 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                          </div>
                          <div>
                            <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                              {customer.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {getRoleBadge(customer.role)}
                          {getStatusBadge(customer.status)}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <ShoppingBag className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                              <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                                {customer.order_count} orders
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
                              <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                                {formatCurrency(customer.total_spent)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-admin-light-text-secondary dark:text-admin-text-secondary">
                            <Calendar className="h-4 w-4" />
                            {formatDate(customer.registered_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-admin-light-border dark:border-admin-border">
              <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} customers
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}