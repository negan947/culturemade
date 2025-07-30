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
  userId?: string;
  sessionId?: string;
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
      console.error('Add to cart error:', error);
      return rejectWithValue('Failed to add item to cart');
    }
  }
);

export const updateQuantity = createAsyncThunk<
  AddToCartResponse,
  { cartItemId: string; quantity: number; userId?: string; sessionId?: string },
  { rejectValue: string }
>(
  'cart/updateQuantity',
  async ({ cartItemId, quantity, userId, sessionId }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity, userId, sessionId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update quantity');
      }
      
      return { success: true, ...data };
    } catch (error) {
      console.error('Update quantity error:', error);
      return rejectWithValue('Failed to update quantity');
    }
  }
);

export const removeItem = createAsyncThunk<
  AddToCartResponse,
  { cartItemId: string; userId?: string; sessionId?: string },
  { rejectValue: string }
>(
  'cart/removeItem',
  async ({ cartItemId, userId, sessionId }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, userId, sessionId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to remove item');
      }
      
      return { success: true, ...data };
    } catch (error) {
      console.error('Remove item error:', error);
      return rejectWithValue('Failed to remove item');
    }
  }
);

export const loadCart = createAsyncThunk<
  CartSummary,
  { userId?: string; sessionId?: string },
  { rejectValue: string }
>(
  'cart/loadCart',
  async ({ userId, sessionId }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (sessionId) params.append('sessionId', sessionId);
      
      const response = await fetch(`/api/cart?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to load cart');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Load cart error:', error);
      return rejectWithValue('Failed to load cart');
    }
  }
);

export const clearCartAsync = createAsyncThunk<
  boolean,
  { userId?: string; sessionId?: string },
  { rejectValue: string }
>(
  'cart/clearCart',
  async ({ userId, sessionId }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to clear cart');
      }
      
      return true;
    } catch (error) {
      console.error('Clear cart error:', error);
      return rejectWithValue('Failed to clear cart');
    }
  }
);

export const loadItemCount = createAsyncThunk<
  number,
  { userId?: string; sessionId?: string },
  { rejectValue: string }
>(
  'cart/loadItemCount',
  async ({ userId, sessionId }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (sessionId) params.append('sessionId', sessionId);
      
      const response = await fetch(`/api/cart/count?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to load item count');
      }
      
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Load item count error:', error);
      return rejectWithValue('Failed to load item count');
    }
  }
);

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartId: (state, action: PayloadAction<{ userId?: string; sessionId?: string }>) => {
      state.userId = action.payload.userId;
      state.sessionId = action.payload.sessionId;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearLastAddedItem: (state) => {
      state.lastAddedItem = null;
    },
    // Optimistic updates
    optimisticAddItem: (state, action: PayloadAction<CartItem>) => {
      const existingIndex = state.items.findIndex(
        item => item.variant_id === action.payload.variant_id
      );
      
      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    optimisticUpdateQuantity: (state, action: PayloadAction<{ cartItemId: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.cartItemId);
      if (item) {
        item.quantity = action.payload.quantity;
        state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    },
    optimisticRemoveItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    // Rollback optimistic updates on failure
    rollbackOptimisticUpdate: (state, action: PayloadAction<CartSummary>) => {
      state.items = action.payload.items;
      state.itemCount = action.payload.itemCount;
      state.summary = action.payload;
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
        
        if (action.payload.cartItem) {
          state.lastAddedItem = action.payload.cartItem;
        }
        
        // After adding item, we need to refresh cart to get updated totals
        // This will be handled by the component calling loadCart after addToCart
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
        
        // After updating quantity, we need to refresh cart to get updated totals
        // This will be handled by the component calling loadCart after updateQuantity
      })
      .addCase(updateQuantity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update quantity';
      });

    // Remove item
    builder
      .addCase(removeItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // After removing item, we need to refresh cart to get updated totals
        // This will be handled by the component calling loadCart after removeItem
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
        state.items = action.payload.items;
        state.summary = action.payload;
        state.itemCount = action.payload.itemCount;
      })
      .addCase(loadCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load cart';
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

    // Load item count
    builder
      .addCase(loadItemCount.fulfilled, (state, action) => {
        state.itemCount = action.payload;
      });
  }
});

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