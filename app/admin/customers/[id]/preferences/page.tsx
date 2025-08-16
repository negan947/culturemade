'use client';

import { ArrowLeft, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface CustomerPreferences {
  notifications: {
    email_marketing: boolean;
    email_orders: boolean;
    email_promotions: boolean;
    sms_notifications: boolean;
  };
  shopping: {
    preferred_size: string;
    preferred_category: string;
    currency: string;
    language: string;
  };
  privacy: {
    profile_public: boolean;
    analytics_tracking: boolean;
    personalized_ads: boolean;
  };
}

interface CustomerBasicInfo {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

export default function CustomerPreferencesPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerBasicInfo | null>(null);
  const [preferences, setPreferences] = useState<CustomerPreferences>({
    notifications: {
      email_marketing: false,
      email_orders: true,
      email_promotions: false,
      sms_notifications: false,
    },
    shopping: {
      preferred_size: '',
      preferred_category: '',
      currency: 'USD',
      language: 'en',
    },
    privacy: {
      profile_public: false,
      analytics_tracking: true,
      personalized_ads: false,
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerAndPreferences();
  }, [customerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCustomerAndPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic customer info
      const customerResponse = await fetch(`/api/admin/customers/${customerId}`);
      const customerData = await customerResponse.json();

      if (!customerResponse.ok) {
        throw new Error(customerData.error || 'Failed to fetch customer');
      }

      setCustomer({
        id: customerData.id,
        full_name: customerData.full_name,
        email: customerData.email,
        role: customerData.role
      });

      // Fetch preferences (this API endpoint would need to be created)
      try {
        const prefsResponse = await fetch(`/api/profile/preferences?customer_id=${customerId}`);
        if (prefsResponse.ok) {
          const prefsData = await prefsResponse.json();
          if (prefsData.preferences) {
            setPreferences(prefsData.preferences);
          }
        }
      } catch {
        // Preferences fetch failed, use defaults
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/profile/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_id: customerId,
          preferences: preferences
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      // Show success and optionally navigate back
      alert('Customer preferences saved successfully');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationPreference = (key: keyof CustomerPreferences['notifications'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const updateShoppingPreference = (key: keyof CustomerPreferences['shopping'], value: string) => {
    setPreferences(prev => ({
      ...prev,
      shopping: {
        ...prev.shopping,
        [key]: value
      }
    }));
  };

  const updatePrivacyPreference = (key: keyof CustomerPreferences['privacy'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-2">
            Error Loading Preferences
          </h3>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-4 text-center">
            {error}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={fetchCustomerAndPreferences} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
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
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-admin-light-text-primary dark:text-admin-text-primary">
              Customer Preferences
            </h1>
            <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
              {customer?.full_name || 'Customer'} ({customer?.email})
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Manage how the customer receives communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Order Updates</Label>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  Email notifications for order status changes
                </div>
              </div>
              <Switch
                checked={preferences.notifications.email_orders}
                onCheckedChange={(checked) => updateNotificationPreference('email_orders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Marketing Emails</Label>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  Promotional emails and newsletters
                </div>
              </div>
              <Switch
                checked={preferences.notifications.email_marketing}
                onCheckedChange={(checked) => updateNotificationPreference('email_marketing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Special Promotions</Label>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  Emails about sales and special offers
                </div>
              </div>
              <Switch
                checked={preferences.notifications.email_promotions}
                onCheckedChange={(checked) => updateNotificationPreference('email_promotions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">SMS Notifications</Label>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  Text message notifications for urgent updates
                </div>
              </div>
              <Switch
                checked={preferences.notifications.sms_notifications}
                onCheckedChange={(checked) => updateNotificationPreference('sms_notifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shopping Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Shopping Preferences</CardTitle>
            <CardDescription>
              Customer's shopping and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="preferred_size">Preferred Size</Label>
              <Select 
                value={preferences.shopping.preferred_size} 
                onValueChange={(value) => updateShoppingPreference('preferred_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">Extra Small (XS)</SelectItem>
                  <SelectItem value="S">Small (S)</SelectItem>
                  <SelectItem value="M">Medium (M)</SelectItem>
                  <SelectItem value="L">Large (L)</SelectItem>
                  <SelectItem value="XL">Extra Large (XL)</SelectItem>
                  <SelectItem value="XXL">2X Large (XXL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_category">Preferred Category</Label>
              <Select 
                value={preferences.shopping.preferred_category} 
                onValueChange={(value) => updateShoppingPreference('preferred_category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mens">Men's Clothing</SelectItem>
                  <SelectItem value="womens">Women's Clothing</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                  <SelectItem value="all">All Categories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={preferences.shopping.currency} 
                onValueChange={(value) => updateShoppingPreference('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={preferences.shopping.language} 
                onValueChange={(value) => updateShoppingPreference('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Data</CardTitle>
            <CardDescription>
              Customer's privacy and data usage preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Public Profile</Label>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  Allow profile to be visible to other customers
                </div>
              </div>
              <Switch
                checked={preferences.privacy.profile_public}
                onCheckedChange={(checked) => updatePrivacyPreference('profile_public', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Analytics Tracking</Label>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  Allow tracking for analytics and improvements
                </div>
              </div>
              <Switch
                checked={preferences.privacy.analytics_tracking}
                onCheckedChange={(checked) => updatePrivacyPreference('analytics_tracking', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Personalized Ads</Label>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  Show personalized advertisements based on activity
                </div>
              </div>
              <Switch
                checked={preferences.privacy.personalized_ads}
                onCheckedChange={(checked) => updatePrivacyPreference('personalized_ads', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}