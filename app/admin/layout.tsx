import {
  BarChart3,
  Home,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { MobileSidebar } from '@/components/admin/mobile-sidebar';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { getUserContext, requireAdmin } from '@/lib/supabase/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Ensure user is admin before rendering
  await requireAdmin();

  // Get user context for display
  const userContext = await getUserContext();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: 'Home',
      description: 'Overview and quick stats',
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: 'Package',
      description: 'Manage product catalog',
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: 'ShoppingCart',
      description: 'View and manage orders',
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: 'Users',
      description: 'Customer management',
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: 'BarChart3',
      description: 'Sales and performance data',
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: 'Settings',
      description: 'System configuration',
    },
  ];

  return (
    <div className='min-h-screen bg-admin-light-bg-main dark:bg-admin-bg-main'>
      {/* Desktop Sidebar */}
      <div className='hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 bg-admin-light-bg-surface dark:bg-admin-bg-surface shadow-admin-soft border-r border-admin-light-border dark:border-admin-border'>
        {/* Header */}
        <div className='flex items-center justify-between h-16 px-6 border-b border-admin-light-border dark:border-admin-border'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-admin-accent rounded-lg flex items-center justify-center shadow-admin-glow'>
              <span className='text-white font-bold text-sm'>CM</span>
            </div>
            <div>
              <h1 className='text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary'>
                CultureMade
              </h1>
              <p className='text-xs text-admin-light-text-secondary dark:text-admin-text-secondary'>
                Admin Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className='mt-6 px-4'>
          <div className='space-y-1'>
            {navigationItems.map((item) => {
              const getIcon = (iconName: string) => {
                switch (iconName) {
                  case 'Home':
                    return Home;
                  case 'Package':
                    return Package;
                  case 'ShoppingCart':
                    return ShoppingCart;
                  case 'Users':
                    return Users;
                  case 'BarChart3':
                    return BarChart3;
                  case 'Settings':
                    return Settings;
                  default:
                    return Home;
                }
              };
              const Icon = getIcon(item.icon);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className='group flex items-center px-3 py-2 text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary rounded-lg hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover hover:text-admin-light-text-primary dark:hover:text-admin-text-primary transition-all duration-200 hover:shadow-admin-soft dark:hover:shadow-admin-soft'
                >
                  <Icon className='mr-3 h-5 w-5 text-admin-light-text-disabled dark:text-admin-text-disabled group-hover:text-admin-accent dark:group-hover:text-admin-accent' />
                  <div className='flex-1'>
                    <div className='font-medium'>{item.name}</div>
                    <div className='text-xs text-admin-light-text-disabled dark:text-admin-text-disabled group-hover:text-admin-light-text-secondary dark:group-hover:text-admin-text-secondary'>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-admin-light-border dark:border-admin-border'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-admin-accent dark:bg-admin-accent rounded-full flex items-center justify-center shadow-admin-glow'>
                <span className='text-white font-medium text-sm'>
                  {userContext?.user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary truncate'>
                  {userContext?.profile?.full_name || 'Admin User'}
                </p>
                <p className='text-xs text-admin-light-text-secondary dark:text-admin-text-secondary truncate'>
                  {userContext?.user?.email}
                </p>
              </div>
            </div>
            <form action='/api/auth/signout' method='post'>
              <button
                type='submit'
                className='p-2 text-admin-light-text-disabled dark:text-admin-text-disabled hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200'
                title='Sign out'
              >
                <LogOut className='h-4 w-4' />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar navigationItems={navigationItems} userContext={userContext} />

      {/* Main Content */}
      <div className='flex-1 lg:ml-64'>
        {/* Top Bar */}
        <header className='bg-admin-light-bg-surface dark:bg-admin-bg-surface shadow-admin-soft border-b border-admin-light-border dark:border-admin-border h-16 flex items-center justify-between px-4 lg:px-6'>
          <div className='flex items-center space-x-4'>
            {/* Mobile Menu Button */}
            <button
              className='lg:hidden p-2 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200'
              id='mobile-menu-button'
            >
              <Menu className='h-6 w-6' />
            </button>
            <h2 className='text-lg lg:text-xl font-semibold text-admin-light-text-primary dark:text-admin-text-primary'>
              Admin Dashboard
            </h2>
          </div>

          <div className='flex items-center space-x-2 lg:space-x-4'>
            <DarkModeToggle />
            <Link
              href='/'
              className='hidden sm:block text-sm text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200'
            >
              ← View Site
            </Link>
            <Link
              href='/'
              className='sm:hidden p-2 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200'
              title='View Site'
            >
              <Home className='h-4 w-4' />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className='p-4 lg:p-6 bg-admin-light-bg-main dark:bg-admin-bg-main min-h-[calc(100vh-4rem)]'>
          {children}
        </main>
      </div>
    </div>
  );
}
