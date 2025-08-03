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

        
        // Show success message with actions taken
        if (checkoutPrep.actions.length > 0) {
          console.log('🔧 Actions taken:', checkoutPrep.actions);
        }

        // TODO: Navigate to Phase 2 checkout page
        alert(`${statusMessage.title}\n\n${statusMessage.message}\n\nCheckout functionality will be implemented in Phase 2.`);
        setCartDrawerOpen(false);
      } else {
        // Cart has validation errors

        
        const errorMessage = checkoutPrep.validationResult.errors.join('\n• ');
        alert(`${statusMessage.title}\n\n• ${errorMessage}\n\nPlease fix these issues and try again.`);
      }
    } catch (error) {
      console.error('Checkout validation failed:', error);
      alert('Failed to validate cart. Please try again.');
    }
  };

  return (
    <div className="relative bg-gray-100 rounded-3xl overflow-hidden h-full w-full">
      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Screen Content */}
        <div className="flex-1 overflow-hidden">
          <CurrentScreen />
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex flex-col items-center justify-center py-2 px-3 rounded-lg
                    transition-colors duration-200
                    ${isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mb-1" fill={isActive ? 'currentColor' : 'none'} />
                  <span className="text-xs font-medium">{tab.name}</span>
                </button>
              );
            })}
            
            {/* Cart Icon */}
            <button
              onClick={handleCartIconClick}
              className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-gray-600 hover:text-gray-900 transition-colors duration-200 relative"
            >
              <CartIcon 
                userId={userId}
                size="md"
                className="mb-1"
                iconClassName="h-5 w-5"
                badgeClassName="bg-red-500 text-white"
              />
              <span className="text-xs font-medium">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        userId={userId}
        onCheckout={handleCheckout}
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
