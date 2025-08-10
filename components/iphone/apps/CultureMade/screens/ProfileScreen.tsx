'use client';

import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  CreditCard,
  Heart,
  Clock,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Shield
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { OrderDetail, OrderHistory } from '../components';
import useAuth from '@/hooks/useAuth';

interface MenuItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
  color?: string;
  action?: () => void;
}

export default function ProfileScreen() {
  const { user, loading, signIn, register, signOut, error } = useAuth();
  const isLoggedIn = !!user;
  const [view, setView] = useState<'root' | 'orders' | 'orderDetail'>('root');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const accountMenuItems: MenuItem[] = [
    {
      id: 'orders',
      icon: Clock,
      label: 'Order History',
      subtitle: '3 recent orders',
      color: 'text-blue-600'
    },
    {
      id: 'addresses',
      icon: MapPin,
      label: 'Addresses',
      subtitle: '2 saved addresses',
      color: 'text-green-600'
    },
    {
      id: 'payment',
      icon: CreditCard,
      label: 'Payment Methods',
      subtitle: '1 card saved',
      color: 'text-purple-600'
    },
    {
      id: 'wishlist',
      icon: Heart,
      label: 'Wishlist',
      subtitle: '5 items saved',
      color: 'text-red-600'
    }
  ];

  const settingsMenuItems: MenuItem[] = [
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      color: 'text-yellow-600'
    },
    {
      id: 'privacy',
      icon: Shield,
      label: 'Privacy & Security',
      color: 'text-gray-600'
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      color: 'text-gray-600'
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Help & Support',
      color: 'text-blue-600'
    }
  ];

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.id === 'orders') {
      setView('orders');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!isLoggedIn) {
    return (
      <div className="h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* Sign In Prompt */}
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in to your account</h3>
            <p className="text-gray-500 mb-6">Access your orders, wishlist, and preferences</p>
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = '/login')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                Sign In
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = '/register')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium"
              >
                Create Account
              </motion.button>
              {error && <div className="text-xs text-red-600">{error}</div>}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (view === 'orders') {
    return (
      <OrderHistory
        onBack={() => setView('root')}
        onSelectOrder={(orderId) => {
          setSelectedOrderId(orderId);
          setView('orderDetail');
        }}
      />
    );
  }

  if (view === 'orderDetail' && selectedOrderId) {
    return (
      <OrderDetail
        orderId={selectedOrderId}
        onBack={() => setView('orders')}
      />
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto culturemade-scrollable">
        {/* User Info */}
        <div className="bg-white px-4 py-6 border-b border-gray-200">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4"
          >
             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{user?.email || 'Customer'}</h2>
              <p className="text-gray-500">Signed in</p>
              <p className="text-sm text-blue-600 mt-1">Premium Member</p>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Orders', value: '12', color: 'text-blue-600' },
              { label: 'Wishlist', value: '5', color: 'text-red-600' },
              { label: 'Points', value: '250', color: 'text-green-600' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Account Section */}
        <div className="px-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
          <div className="space-y-2">
            {accountMenuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleMenuItemPress(item)}
                className="w-full bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between active:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-6 w-6 ${item.color || 'text-gray-600'}`} />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{item.label}</div>
                    {item.subtitle && (
                      <div className="text-sm text-gray-500">{item.subtitle}</div>
                    )}
                  </div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div className="px-4 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
          <div className="space-y-2">
            {settingsMenuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                onClick={() => handleMenuItemPress(item)}
                className="w-full bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between active:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-6 w-6 ${item.color || 'text-gray-600'}`} />
                  <div className="font-medium text-gray-900">{item.label}</div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Sign Out */}
            <div className="px-4 pb-8">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            onClick={handleSignOut}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-medium border border-red-200 flex items-center justify-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </motion.button>
        </div>

        {/* Development Note */}
        <div className="px-4 pb-8">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-indigo-800 text-sm font-medium">👤 Profile Integration</p>
            <p className="text-indigo-700 text-xs mt-1">
              Profile features will connect to authentication system and user account management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}