'use client';

import { LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
}

interface UserContext {
  user?: {
    email?: string;
  };
  profile?: {
    full_name?: string;
  };
}

interface MobileSidebarProps {
  navigationItems: NavigationItem[];
  userContext: UserContext | null;
}

export function MobileSidebar({ navigationItems, userContext }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle mobile menu button click
  useEffect(() => {
    const handleMenuClick = () => {
      setIsOpen(true);
    };

    const menuButton = document.getElementById('mobile-menu-button');
    if (menuButton) {
      menuButton.addEventListener('click', handleMenuClick);
      return () => menuButton.removeEventListener('click', handleMenuClick);
    }
    return undefined;
  }, []);

  // Handle escape key and outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" />
      
      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-admin-light-bg-surface dark:bg-admin-bg-surface shadow-admin-soft border-r border-admin-light-border dark:border-admin-border transform transition-transform duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-admin-light-border dark:border-admin-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-admin-accent rounded-lg flex items-center justify-center shadow-admin-glow">
              <span className="text-white font-bold text-sm">CM</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
                CultureMade
              </h1>
              <p className="text-xs text-admin-light-text-secondary dark:text-admin-text-secondary">
                Admin Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center px-3 py-3 text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary rounded-lg hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover hover:text-admin-light-text-primary dark:hover:text-admin-text-primary transition-all duration-200 hover:shadow-admin-soft dark:hover:shadow-admin-soft"
                >
                  <Icon className="mr-3 h-5 w-5 text-admin-light-text-disabled dark:text-admin-text-disabled group-hover:text-admin-accent dark:group-hover:text-admin-accent" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-admin-light-text-disabled dark:text-admin-text-disabled group-hover:text-admin-light-text-secondary dark:group-hover:text-admin-text-secondary">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-admin-light-border dark:border-admin-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-admin-accent dark:bg-admin-accent rounded-full flex items-center justify-center shadow-admin-glow">
                <span className="text-white font-medium text-sm">
                  {userContext?.user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary truncate">
                  {userContext?.profile?.full_name || 'Admin User'}
                </p>
                <p className="text-xs text-admin-light-text-secondary dark:text-admin-text-secondary truncate">
                  {userContext?.user?.email}
                </p>
              </div>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="p-2 text-admin-light-text-disabled dark:text-admin-text-disabled hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}