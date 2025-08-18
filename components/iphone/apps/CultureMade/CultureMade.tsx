'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Grid3X3, 
  Search, 
  ShoppingBag, 
  User 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { useSelector, useDispatch } from 'react-redux';


import { loadItemCount } from '@/store/cart-slice';
import type { AppDispatch } from '@/store/store';
import { store } from '@/store/store';
import { RootState } from '@/store/store';
import { getCartSessionId } from '@/utils/cartSync';

import { CartDrawer, CartIcon } from './components';
// Import screen components
import CartScreen from './screens/CartScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';

// Icons for navigation

type TabId = 'home' | 'categories' | 'search' | 'cart' | 'profile';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ComponentType<{ className?: string; fill?: string }>;
  screen: React.ComponentType;
}

const tabs: Tab[] = [
  {
    id: 'home',
    name: 'Home',
    icon: Home,
    screen: HomeScreen,
  },
  {
    id: 'categories',
    name: 'Categories',
    icon: Grid3X3,
    screen: CategoriesScreen,
  },
  {
    id: 'search',
    name: 'Search',
    icon: Search,
    screen: SearchScreen,
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: User,
    screen: ProfileScreen,
  },
  {
    id: 'cart',
    name: 'Cart',
    icon: ShoppingBag,
    screen: CartScreen,
  },
];

function CultureMadeInner() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showCheckoutScreen, setShowCheckoutScreen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const cartItemCount = useSelector((state: RootState) => state.cart.itemCount);

  // TODO: Get userId from auth context when available
  const userId = undefined;
  const sessionId = !userId ? getCartSessionId() : undefined;

  // Load cart item count on app mount
  useEffect(() => {
    dispatch(loadItemCount({
      ...(userId ? { userId } : {}),
      ...(sessionId ? { sessionId } : {})
    }));
  }, [dispatch, userId, sessionId]);

  // Global event to open checkout from anywhere (e.g., Buy Now)
  useEffect(() => {
    const handler = () => setShowCheckoutScreen(true);
    window.addEventListener('openCheckout', handler);
    const openCartHandler = () => setCartDrawerOpen(true);
    window.addEventListener('openCart', openCartHandler);
    return () => {
      window.removeEventListener('openCheckout', handler);
      window.removeEventListener('openCart', openCartHandler);
    };
  }, []);

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const CurrentScreen = currentTab?.screen || HomeScreen;

  const handleCartIconClick = () => {
    if (activeTab === 'cart') {
      // If already on cart tab, don't open drawer (screen is visible)
      return;
    }
    // Open cart drawer overlay
    setCartDrawerOpen(true);
  };

  return (
    <div className="h-full w-full bg-gray-900 flex flex-col">
      {/* Main Content Area - Fixed for scrolling */}
      <div className="flex-1 overflow-hidden pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.25, 0.46, 0.45, 0.94] // iOS-style easing
            }}
            className="h-full overflow-y-auto scrollable culturemade-scrollable drag-scroll-container"
            onMouseDown={(e) => {
              // Only enable drag scrolling on desktop (non-touch devices)
              if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
              
              const container = e.currentTarget;
              let isScrolling = false;
              const startY = e.pageY;
              const startScrollTop = container.scrollTop;

              const handleMouseMove = (e: MouseEvent) => {
                if (!isScrolling) return;
                e.preventDefault();
                const deltaY = e.pageY - startY;
                container.scrollTop = startScrollTop - deltaY;
              };

              const handleMouseUp = () => {
                isScrolling = false;
                container.style.cursor = '';
                container.style.userSelect = '';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              // Start drag scrolling
              isScrolling = true;
              container.style.cursor = 'grabbing';
              container.style.userSelect = 'none';
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            style={{ cursor: 'grab' }}
          >
            <CurrentScreen />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Tab Navigation */}
      <div className="relative bg-gray-800 border-t border-gray-700">
        {/* Visual background extension under HomeBar */}
        <div className="absolute inset-x-0 top-0 bottom-0 bg-gray-800 z-0" style={{ height: 'calc(100% + 50px)' }} />
        
        <div className="relative z-10 flex justify-around items-center px-2 py-3 pb-2">
          {tabs.map((tab) => {
            // Cart tab is never "active" since it only opens drawer
            const isActive = tab.id === 'cart' ? false : activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <motion.button
                key={tab.id}
                onTap={() => {
                  if (tab.id === 'cart') {
                    // Cart opens drawer, doesn't change active tab
                    handleCartIconClick();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <div className="relative">
                  {tab.id === 'cart' ? (
                    <CartIcon
                      {...(userId ? { userId } : {})}
                      className=""
                      iconClassName={`w-6 h-6 transition-colors duration-200 ${
                        isActive 
                          ? 'text-admin-accent' 
                          : 'text-gray-400'
                      }`}
                      badgeClassName="bg-red-500 text-white"
                      size="md"
                      showBadge={true}
                    />
                  ) : (
                    <Icon 
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isActive 
                          ? 'text-admin-accent' 
                          : 'text-gray-400'
                      }`}
                      fill={isActive ? 'currentColor' : 'none'}
                    />
                  )}
                </div>
                <span 
                  className={`text-xs mt-1 transition-colors duration-200 ${
                    isActive 
                      ? 'text-admin-accent font-medium' 
                      : 'text-gray-400'
                  }`}
                >
                  {tab.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        {...(userId ? { userId } : {})}
        onCheckout={() => {
          setCartDrawerOpen(false);
          setShowCheckoutScreen(true);
        }}
      />

      {/* Checkout Screen (full-screen inside app) */}
      {showCheckoutScreen && (
        <div className="absolute inset-0 z-40 bg-gray-900 pt-safe-top pb-safe-bottom">
          <CheckoutScreen
            onClose={() => setShowCheckoutScreen(false)}
            {...(userId ? { userId } : {})}
          />
        </div>
      )}
    </div>
  );
}

export default function CultureMade() {
  return (
    <Provider store={store}>
      <CultureMadeInner />
    </Provider>
  );
}