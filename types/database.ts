export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types
export type UserRole = 'customer' | 'admin';
export type ProductStatus = 'active' | 'draft' | 'archived';
export type CollectionStatus = 'active' | 'draft';
export type AddressType = 'billing' | 'shipping' | 'both';
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'refunded'
  | 'partially_refunded';
export type FulfillmentStatus =
  | 'unfulfilled'
  | 'partially_fulfilled'
  | 'fulfilled';
export type PaymentMethodType = 'card' | 'bank_transfer' | 'cash' | 'other';
export type PaymentTransactionStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded';
export type ShipmentStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'returned';
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type InventoryMovementType =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'damage';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          cost: number | null;
          sku: string | null;
          barcode: string | null;
          track_quantity: boolean | null;
          quantity: number | null;
          allow_backorder: boolean | null;
          weight: number | null;
          status: ProductStatus | null;
          featured: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          cost?: number | null;
          sku?: string | null;
          barcode?: string | null;
          track_quantity?: boolean | null;
          quantity?: number | null;
          allow_backorder?: boolean | null;
          weight?: number | null;
          status?: ProductStatus | null;
          featured?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          cost?: number | null;
          sku?: string | null;
          barcode?: string | null;
          track_quantity?: boolean | null;
          quantity?: number | null;
          allow_backorder?: boolean | null;
          weight?: number | null;
          status?: ProductStatus | null;
          featured?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string | null;
          name: string;
          price: number | null;
          sku: string | null;
          barcode: string | null;
          quantity: number | null;
          weight: number | null;
          option1: string | null;
          option2: string | null;
          option3: string | null;
          position: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          name: string;
          price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          quantity?: number | null;
          weight?: number | null;
          option1?: string | null;
          option2?: string | null;
          option3?: string | null;
          position?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          name?: string;
          price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          quantity?: number | null;
          weight?: number | null;
          option1?: string | null;
          option2?: string | null;
          option3?: string | null;
          position?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          variant_id: string | null;
          url: string;
          alt_text: string | null;
          position: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          url: string;
          alt_text?: string | null;
          position?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          url?: string;
          alt_text?: string | null;
          position?: number | null;
          created_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          position: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          position?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          position?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      product_categories: {
        Row: {
          product_id: string;
          category_id: string;
        };
        Insert: {
          product_id: string;
          category_id: string;
        };
        Update: {
          product_id?: string;
          category_id?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          status: CollectionStatus | null;
          position: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          status?: CollectionStatus | null;
          position?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          status?: CollectionStatus | null;
          position?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      product_collections: {
        Row: {
          product_id: string;
          collection_id: string;
        };
        Insert: {
          product_id: string;
          collection_id: string;
        };
        Update: {
          product_id?: string;
          collection_id?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string | null;
          type: AddressType | null;
          is_default: boolean | null;
          first_name: string;
          last_name: string;
          company: string | null;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          state_province: string;
          postal_code: string;
          country_code: string;
          phone: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: AddressType | null;
          is_default?: boolean | null;
          first_name: string;
          last_name: string;
          company?: string | null;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          state_province: string;
          postal_code: string;
          country_code: string;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: AddressType | null;
          is_default?: boolean | null;
          first_name?: string;
          last_name?: string;
          company?: string | null;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          state_province?: string;
          postal_code?: string;
          country_code?: string;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          product_id: string | null;
          variant_id: string | null;
          quantity: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          quantity?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          quantity?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          email: string;
          phone: string | null;
          status: OrderStatus | null;
          payment_status: PaymentStatus | null;
          fulfillment_status: FulfillmentStatus | null;
          subtotal: number;
          tax_amount: number | null;
          shipping_amount: number | null;
          discount_amount: number | null;
          total_amount: number;
          currency: string | null;
          billing_address_id: string | null;
          shipping_address_id: string | null;
          notes: string | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          email: string;
          phone?: string | null;
          status?: OrderStatus | null;
          payment_status?: PaymentStatus | null;
          fulfillment_status?: FulfillmentStatus | null;
          subtotal: number;
          tax_amount?: number | null;
          shipping_amount?: number | null;
          discount_amount?: number | null;
          total_amount: number;
          currency?: string | null;
          billing_address_id?: string | null;
          shipping_address_id?: string | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          email?: string;
          phone?: string | null;
          status?: OrderStatus | null;
          payment_status?: PaymentStatus | null;
          fulfillment_status?: FulfillmentStatus | null;
          subtotal?: number;
          tax_amount?: number | null;
          shipping_amount?: number | null;
          discount_amount?: number | null;
          total_amount?: number;
          currency?: string | null;
          billing_address_id?: string | null;
          shipping_address_id?: string | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_name: string | null;
          price: number;
          quantity: number;
          subtotal: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          variant_name?: string | null;
          price: number;
          quantity: number;
          subtotal: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          product_name?: string;
          variant_name?: string | null;
          price?: number;
          quantity?: number;
          subtotal?: number;
          created_at?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          amount: number;
          currency: string | null;
          status: PaymentTransactionStatus | null;
          method: PaymentMethodType | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          amount: number;
          currency?: string | null;
          status?: PaymentTransactionStatus | null;
          method?: PaymentMethodType | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          amount?: number;
          currency?: string | null;
          status?: PaymentTransactionStatus | null;
          method?: PaymentMethodType | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      shipping_methods: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          base_rate: number;
          per_item_rate: number | null;
          min_order_amount: number | null;
          max_order_amount: number | null;
          is_active: boolean | null;
          estimated_days_min: number | null;
          estimated_days_max: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          base_rate: number;
          per_item_rate?: number | null;
          min_order_amount?: number | null;
          max_order_amount?: number | null;
          is_active?: boolean | null;
          estimated_days_min?: number | null;
          estimated_days_max?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          base_rate?: number;
          per_item_rate?: number | null;
          min_order_amount?: number | null;
          max_order_amount?: number | null;
          is_active?: boolean | null;
          estimated_days_min?: number | null;
          estimated_days_max?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      shipments: {
        Row: {
          id: string;
          order_id: string | null;
          tracking_number: string | null;
          carrier: string | null;
          shipping_method_id: string | null;
          status: ShipmentStatus | null;
          shipped_at: string | null;
          delivered_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          tracking_number?: string | null;
          carrier?: string | null;
          shipping_method_id?: string | null;
          status?: ShipmentStatus | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          tracking_number?: string | null;
          carrier?: string | null;
          shipping_method_id?: string | null;
          status?: ShipmentStatus | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          type: DiscountType;
          value: number;
          min_order_amount: number | null;
          usage_limit: number | null;
          usage_count: number | null;
          is_active: boolean | null;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          type: DiscountType;
          value: number;
          min_order_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number | null;
          is_active?: boolean | null;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          type?: DiscountType;
          value?: number;
          min_order_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number | null;
          is_active?: boolean | null;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string | null;
          user_id: string | null;
          order_id: string | null;
          rating: number;
          title: string | null;
          comment: string | null;
          is_verified_purchase: boolean | null;
          is_published: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          user_id?: string | null;
          order_id?: string | null;
          rating: number;
          title?: string | null;
          comment?: string | null;
          is_verified_purchase?: boolean | null;
          is_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          user_id?: string | null;
          order_id?: string | null;
          rating?: number;
          title?: string | null;
          comment?: string | null;
          is_verified_purchase?: boolean | null;
          is_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      inventory_movements: {
        Row: {
          id: string;
          variant_id: string | null;
          type: InventoryMovementType;
          quantity: number;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          variant_id?: string | null;
          type: InventoryMovementType;
          quantity: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          variant_id?: string | null;
          type?: InventoryMovementType;
          quantity?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_name: string;
          user_id: string | null;
          session_id: string | null;
          properties: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_name: string;
          user_id?: string | null;
          session_id?: string | null;
          properties?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          event_name?: string;
          user_id?: string | null;
          session_id?: string | null;
          properties?: Json | null;
          created_at?: string | null;
        };
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Commonly used table types
export type Profile = Tables<'profiles'>;
export type Product = Tables<'products'>;
export type ProductVariant = Tables<'product_variants'>;
export type ProductImage = Tables<'product_images'>;
export type Category = Tables<'categories'>;
export type Collection = Tables<'collections'>;
export type Address = Tables<'addresses'>;
export type CartItem = Tables<'cart_items'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type Payment = Tables<'payments'>;
export type ShippingMethod = Tables<'shipping_methods'>;
export type Shipment = Tables<'shipments'>;
export type Discount = Tables<'discounts'>;
export type Review = Tables<'reviews'>;
export type InventoryMovement = Tables<'inventory_movements'>;
export type AnalyticsEvent = Tables<'analytics_events'>;
export type AdminLog = Tables<'admin_logs'>;

// Insert types
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProductInsert = TablesInsert<'products'>;
export type ProductVariantInsert = TablesInsert<'product_variants'>;
export type ProductImageInsert = TablesInsert<'product_images'>;
export type CategoryInsert = TablesInsert<'categories'>;
export type CollectionInsert = TablesInsert<'collections'>;
export type AddressInsert = TablesInsert<'addresses'>;
export type CartItemInsert = TablesInsert<'cart_items'>;
export type OrderInsert = TablesInsert<'orders'>;
export type OrderItemInsert = TablesInsert<'order_items'>;
export type PaymentInsert = TablesInsert<'payments'>;
export type ShippingMethodInsert = TablesInsert<'shipping_methods'>;
export type ShipmentInsert = TablesInsert<'shipments'>;
export type DiscountInsert = TablesInsert<'discounts'>;
export type ReviewInsert = TablesInsert<'reviews'>;
export type InventoryMovementInsert = TablesInsert<'inventory_movements'>;
export type AnalyticsEventInsert = TablesInsert<'analytics_events'>;
export type AdminLogInsert = TablesInsert<'admin_logs'>;

// Update types
export type ProfileUpdate = TablesUpdate<'profiles'>;
export type ProductUpdate = TablesUpdate<'products'>;
export type ProductVariantUpdate = TablesUpdate<'product_variants'>;
export type ProductImageUpdate = TablesUpdate<'product_images'>;
export type CategoryUpdate = TablesUpdate<'categories'>;
export type CollectionUpdate = TablesUpdate<'collections'>;
export type AddressUpdate = TablesUpdate<'addresses'>;
export type CartItemUpdate = TablesUpdate<'cart_items'>;
export type OrderUpdate = TablesUpdate<'orders'>;
export type OrderItemUpdate = TablesUpdate<'order_items'>;
export type PaymentUpdate = TablesUpdate<'payments'>;
export type ShippingMethodUpdate = TablesUpdate<'shipping_methods'>;
export type ShipmentUpdate = TablesUpdate<'shipments'>;
export type DiscountUpdate = TablesUpdate<'discounts'>;
export type ReviewUpdate = TablesUpdate<'reviews'>;
export type InventoryMovementUpdate = TablesUpdate<'inventory_movements'>;
export type AnalyticsEventUpdate = TablesUpdate<'analytics_events'>;
export type AdminLogUpdate = TablesUpdate<'admin_logs'>;
