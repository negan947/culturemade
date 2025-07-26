# Supabase Database Workflow
**MCP Integration and SQL Generation Guidelines**

## 🔄 **MANDATORY WORKFLOW**

### **Before ANY Database Work**
1. **Always check current state** using MCP tools:
   ```
   mcp__supabasecm__list_tables - Check existing tables
   mcp__supabasecm__execute_sql - Query current data
   ```

2. **Verify table structure** if making schema changes:
   ```sql
   -- Check table structure
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'products' AND table_schema = 'public';
   ```

### **Data Operations**
- **Reading Data**: Always use MCP tools first
- **Writing Data**: Use Supabase client in application code
- **Schema Changes**: Generate SQL files for manual execution

## 🗄️ **CURRENT DATABASE STATE** (Verified)

### **✅ ALL 20 TABLES EXIST IN SUPABASE**
- addresses
- admin_logs  
- analytics_events
- cart_items
- categories
- collections
- discounts
- inventory_movements
- order_items
- orders
- payments
- product_categories
- product_collections
- product_images
- product_variants
- products
- profiles
- reviews
- shipments
- shipping_methods

## 🛠️ **SQL FILE GENERATION PROCESS**

### **When New Tables/Columns Needed**
1. **Generate SQL file** with clear filename
2. **Include full CREATE/ALTER statements**
3. **Add RLS policies**
4. **Include indexes if needed**
5. **User copies and pastes into Supabase dashboard**

### **Example SQL File Structure**
```sql
-- File: add_product_tags_table.sql
-- Purpose: Add product tagging functionality
-- Date: 2025-07-25

-- Create product_tags table
CREATE TABLE IF NOT EXISTS product_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product tags are publicly readable" ON product_tags
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify product tags" ON product_tags
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add index for performance
CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag ON product_tags(tag);
```

## 💳 **STRIPE INTEGRATION NOTES**

### **Payment Flow**
1. **Frontend**: Stripe Elements for card input
2. **Backend**: Create PaymentIntent via Stripe API
3. **Database**: Store payment records in `payments` table
4. **Webhooks**: Handle payment confirmation events
5. **Orders**: Create order record after successful payment

### **Real Money Only**
- **No test/mock payments** in database
- **Stripe test mode** for development
- **Real Stripe keys** for production
- **Apple Pay** integration via Stripe

## 🔧 **MCP TOOL REFERENCE**

### **Common MCP Commands**
```typescript
// List all tables
mcp__supabasecm__list_tables()

// Execute SQL query
mcp__supabasecm__execute_sql({
  query: "SELECT COUNT(*) FROM products"
})

// Check current products
mcp__supabasecm__execute_sql({
  query: "SELECT id, name, status FROM products LIMIT 5"
})

// Verify table structure
mcp__supabasecm__execute_sql({
  query: `SELECT column_name, data_type 
           FROM information_schema.columns 
           WHERE table_name = 'products'`
})
```

## 📂 **SUPABASE STORAGE**

### **Existing Buckets**
- **product-images** - Product photos (public)
- **user-avatars** - Profile pictures (private)

### **Image Storage Workflow**
1. **Upload** to Supabase Storage bucket
2. **Get public URL** from Supabase
3. **Store URL** in `product_images` table
4. **Reference** from frontend using URL

## ⚠️ **CRITICAL REMINDERS**

1. **Always use MCP first** - Check before creating/modifying
2. **Real data only** - No mocks, no local storage
3. **SQL files for schema** - Generate for user to copy/paste
4. **Stripe for payments** - Real payment processing
5. **RLS policies required** - All tables must have security policies
6. **Supabase is single source** - No external databases

---

**📝 This workflow ensures consistency and prevents conflicts with the existing Supabase setup.**