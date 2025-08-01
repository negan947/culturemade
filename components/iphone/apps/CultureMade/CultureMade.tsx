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
import { store } from '@/store/store';
import { RootState } from '@/store/store';
import { getCartSessionId } from '@/utils/cartSync';
import { prepareForCheckout, getCheckoutStatusMessage } from '@/utils/checkoutUtils';

import { CartDrawer, CartIcon, DragScrollContainer } from './components';
// Import screen components
import CategoriesScreen from './screens/CategoriesScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';

// Icons for navigation

type TabId = 'home' | 'categories' | 'search' | 'profile';

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
];

function CultureMadeInner() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const dispatch = useDispatch();
  const cartItemCount = useSelector((state: RootState) => state.cart.itemCount);

  // TODO: Get userId from auth context when available
  const userId = undefined;
  const sessionId = !userId ? getCartSessionId() : undefined;

  // Load cart item count on app mount
  useEffect(() => {
    dispatch(loadItemCount({ userId, sessionId }));
  }, [dispatch, userId, sessionId]);

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const CurrentScreen = currentTab?.screen || HomeScreen;

  const handleCartIconClick = () => {
    // Always open cart drawer when cart icon is clicked
    setCartDrawerOpen(true);
  };

  const handleCheckout = async () => {
    try {
      // Validate cart before proceeding to checkout
      const checkoutPrep = await prepareForCheckout({
        userId,
        sessionId,
        autoResolveConflicts: true,
        removeUnavailable: true
      });

      const statusMessage = getCheckoutStatusMessage(checkoutPrep.validationResult);

      if (checkoutPrep.canProceed) {
        // Cart is ready for checkout
        console.log('✅ Cart validated successfully:', statusMessage.message);
        
        // Show success message with actions taken
        if (checkoutPrep.actions.length > 0) {
          console.log('🔧 Actions taken:', checkoutPrep.actions);
        }

        // TODO: Navigate to Phase 2 checkout page
        alert(`${statusMessage.title}\n\n${statusMessage.message}\n\nCheckout functionality will be implemented in Phase 2.`);
        setCartDrawerOpen(false);
      } else {
        // Cart has validation errors
        console.error('❌ Cart validation failed:', checkoutPrep.validationResult.errors);
        
        const errorMessage = checkoutPrep.validationResult.errors.join('\n• ');
        alert(`${statusMessage.title}\n\n• ${errorMessage}\n\nPlease fix these issues and try again.`);
      }
    } catch (error) {
      console.error('Checkout preparation failed:', error);
      alert('Failed to prepare checkout. Please try again.');
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
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
            className="h-full"
          >
            <DragScrollContainer 
              className="h-full overflow-y-auto culturemade-scrollable"
              direction="vertical"
              sensitivity={1}
            >
              <CurrentScreen />
            </DragScrollContainer>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Tab Navigation */}
      <div className="bg-white border-t border-gray-200">
        <div className="flex justify-around items-center px-2 py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <motion.button
                key={tab.id}
                onTap={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive 
                        ? 'text-blue-500' 
                        : 'text-gray-500'
                    }`}
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                </div>
                <span 
                  className={`text-xs mt-1 transition-colors duration-200 ${
                    isActive 
                      ? 'text-blue-500 font-medium' 
                      : 'text-gray-500'
                  }`}
                >
                  {tab.name}
                </span>
              </motion.button>
            );
          })}
          
          {/* Dedicated Cart Icon - Always Visible */}
          <motion.button
            onTap={handleCartIconClick}
            className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1"
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <div className="relative">
              <CartIcon
                userId={userId}
                className=""
                iconClassName="w-6 h-6 transition-colors duration-200 text-gray-500 hover:text-blue-500"
                badgeClassName="bg-red-500 text-white"
                size="md"
                showBadge={true}
              />
            </div>
            <span className="text-xs mt-1 transition-colors duration-200 text-gray-500">
              Cart
            </span>
          </motion.button>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onCheckout={handleCheckout}
        userId={userId}
      />
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