import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { 
  CartItem,
  CartSummary,
  AddToCartRequest,
  AddToCartResponse
} from '@/utils/cartUtils';

// Note: Cart operations use API routes with MCP integration
// instead of direct utility imports

export interface CartState {
  items: CartItem[];
  summary: CartSummary | null;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  lastAddedItem: CartItem | null;
  userId?: string | undefined;
  sessionId?: string | undefined;
}

const initialState: CartState = {
  items: [],
  summary: null,
  itemCount: 0,
  isLoading: false,
  error: null,
  lastAddedItem: null
};

// Async thunks
export const addToCart = createAsyncThunk<
  AddToCartResponse,
  AddToCartRequest,
  { rejectValue: string }
>(
  'cart/addToCart',
  async (request, { rejectWithValue }) => {
    try {
      // Use API route instead of direct utility call
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to add item to cart');
      }
      
      return { success: true, ...data };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add item to cart');
    }
  }
);

// Additional async thunks for complete cart functionality
export const updateQuantity = createAsyncThunk<
  any,
  { cartItemId: string; quantity: number },
  { rejectValue: string }
>(
  'cart/updateQuantity',
  async ({ cartItemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update cart');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update cart');
    }
  }
);

export const removeItem = createAsyncThunk<
  any,
  { cartItemId: string },
  { rejectValue: string }
>(
  'cart/removeItem',
  async ({ cartItemId }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to remove item');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove item');
    }
  }
);

export const loadCart = createAsyncThunk<
  any,
  { userId?: string; sessionId?: string } | void,
  { rejectValue: string }
>(
  'cart/loadCart',
  async (params, { rejectWithValue }) => {
    try {
      // Get sessionId from cartSync if not provided
      const { getCartSessionId } = await import('@/utils/cartSync');
      const sessionId = params?.sessionId || (!params?.userId ? getCartSessionId() : undefined);
      
      const searchParams = new URLSearchParams();
      if (params?.userId) {
        searchParams.append('userId', params.userId);
      } else if (sessionId) {
        searchParams.append('sessionId', sessionId);
      }
      
      const response = await fetch(`/api/cart?${searchParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to load cart');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load cart');
    }
  }
);

export const loadItemCount = createAsyncThunk<
  number,
  { userId?: string; sessionId?: string } | void,
  { rejectValue: string }
>(
  'cart/loadItemCount',
  async (params, { rejectWithValue }) => {
    try {
      // Get sessionId from cartSync if not provided
      const { getCartSessionId } = await import('@/utils/cartSync');
      const sessionId = params?.sessionId || (!params?.userId ? getCartSessionId() : undefined);
      
      const searchParams = new URLSearchParams();
      if (params?.userId) {
        searchParams.append('userId', params.userId);
      } else if (sessionId) {
        searchParams.append('sessionId', sessionId);
      }
      
      const response = await fetch(`/api/cart/count?${searchParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to load cart count');
      }
      
      return data.count || 0;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load cart count');
    }
  }
);

export const clearCartAsync = createAsyncThunk<
  any,
  { userId?: string; sessionId?: string } | void,
  { rejectValue: string }
>(
  'cart/clearCart',
  async (params, { rejectWithValue }) => {
    try {
      // Get sessionId from cartSync if not provided
      const { getCartSessionId } = await import('@/utils/cartSync');
      const sessionId = params?.sessionId || (!params?.userId ? getCartSessionId() : undefined);
      
      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(params?.userId ? { userId: params.userId } : {}),
          ...(sessionId ? { sessionId } : {})
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to clear cart');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to clear cart');
    }
  }
);

// Create the cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Synchronous actions
    setCartId: (state, action: PayloadAction<{ userId?: string | undefined; sessionId?: string | undefined }>) => {
      state.userId = action.payload.userId;
      state.sessionId = action.payload.sessionId;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearLastAddedItem: (state) => {
      state.lastAddedItem = null;
    },
    // Optimistic update actions
    optimisticAddItem: (state, action: PayloadAction<CartItem>) => {
      state.items.push(action.payload);
      state.itemCount += action.payload.quantity;
      state.lastAddedItem = action.payload;
    },
    optimisticUpdateQuantity: (state, action: PayloadAction<{ cartItemId: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.cartItemId);
      if (item) {
        const oldQuantity = item.quantity;
        item.quantity = action.payload.quantity;
        state.itemCount = state.itemCount - oldQuantity + action.payload.quantity;
      }
    },
    optimisticRemoveItem: (state, action: PayloadAction<{ cartItemId: string }>) => {
      const itemIndex = state.items.findIndex(item => item.id === action.payload.cartItemId);
      if (itemIndex !== -1) {
        const item = state.items[itemIndex];
        if (item) {
          state.itemCount -= item.quantity;
        }
        state.items.splice(itemIndex, 1);
      }
    },
    rollbackOptimisticUpdate: (state, action: PayloadAction<{ originalState: CartState }>) => {
      // Restore previous state on failure
      return action.payload.originalState;
    }
  },
  extraReducers: (builder) => {
    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.cart) {
          state.items = action.payload.cart.items || [];
          state.summary = {
            ...action.payload.cart,
            summary: action.payload.cart
          };
          state.itemCount = action.payload.cart.items?.reduce((total: number, item: CartItem) => total + item.quantity, 0) || 0;
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to add item to cart';
      });

    // Update quantity
    builder
      .addCase(updateQuantity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateQuantity.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.cart) {
          state.items = action.payload.cart.items || [];
          state.summary = {
            ...action.payload.cart,
            summary: action.payload.cart
          };
          state.itemCount = action.payload.cart.items?.reduce((total: number, item: CartItem) => total + item.quantity, 0) || 0;
        }
      })
      .addCase(updateQuantity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update cart';
      });

    // Remove item
    builder
      .addCase(removeItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.cart) {
          state.items = action.payload.cart.items || [];
          state.summary = {
            ...action.payload.cart,
            summary: action.payload.cart
          };
          state.itemCount = action.payload.cart.items?.reduce((total: number, item: CartItem) => total + item.quantity, 0) || 0;
        }
      })
      .addCase(removeItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to remove item';
      });

    // Load cart
    builder
      .addCase(loadCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.cart) {
          state.items = action.payload.cart.items || [];
          state.summary = {
            ...action.payload.cart,
            summary: action.payload.cart
          };
          state.itemCount = action.payload.cart.items?.reduce((total: number, item: CartItem) => total + item.quantity, 0) || 0;
        }
      })
      .addCase(loadCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load cart';
      });

    // Load item count
    builder
      .addCase(loadItemCount.pending, (state) => {
        state.error = null;
      })
      .addCase(loadItemCount.fulfilled, (state, action) => {
        state.itemCount = action.payload;
      })
      .addCase(loadItemCount.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load cart count';
      });

    // Clear cart
    builder
      .addCase(clearCartAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.summary = null;
        state.itemCount = 0;
        state.lastAddedItem = null;
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to clear cart';
      });
  }
});

// Export actions
export const {
  setCartId,
  clearError,
  clearLastAddedItem,
  optimisticAddItem,
  optimisticUpdateQuantity,
  optimisticRemoveItem,
  rollbackOptimisticUpdate
} = cartSlice.actions;

export default cartSlice.reducer;
