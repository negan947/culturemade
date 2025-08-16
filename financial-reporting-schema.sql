-- =====================================================
-- CultureMade Enhanced Financial Reporting Schema
-- =====================================================
-- This file contains the complete SQL schema for implementing
-- comprehensive financial reporting and analytics capabilities.
--
-- Current Database Status:
-- - 20 existing tables with basic e-commerce functionality
-- - Orders, payments, products, inventory tracking already implemented
-- - This schema adds advanced financial reporting on top of existing structure
--
-- Execute this in Supabase SQL Editor in the order presented
-- =====================================================

-- ============================================================================
-- 1. FINANCIAL PERIODS TABLE
-- ============================================================================
-- Tracks accounting periods for financial reporting
CREATE TABLE IF NOT EXISTS financial_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- e.g., "Q1 2024", "January 2024"
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_period_dates CHECK (end_date >= start_date),
    CONSTRAINT unique_period_name UNIQUE (name)
);

-- Indexes for financial periods
CREATE INDEX IF NOT EXISTS idx_financial_periods_dates ON financial_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_financial_periods_type ON financial_periods(period_type);
CREATE INDEX IF NOT EXISTS idx_financial_periods_closed ON financial_periods(is_closed);

-- ============================================================================
-- 2. TAX RATES TABLE
-- ============================================================================
-- Manages tax rates by location and time period
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code CHAR(2) NOT NULL,
    state_province VARCHAR(10), -- NULL for country-level rates
    postal_code VARCHAR(20), -- NULL for broader geographic rates
    tax_type VARCHAR(50) NOT NULL, -- 'sales_tax', 'vat', 'gst', etc.
    rate DECIMAL(5,4) NOT NULL CHECK (rate >= 0 AND rate <= 1), -- 0.0875 for 8.75%
    name VARCHAR(100) NOT NULL, -- "California Sales Tax", "UK VAT"
    description TEXT,
    effective_from DATE NOT NULL,
    effective_to DATE, -- NULL means currently active
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_tax_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Indexes for tax rates
CREATE INDEX IF NOT EXISTS idx_tax_rates_location ON tax_rates(country_code, state_province, postal_code);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_tax_rates_type ON tax_rates(tax_type);

-- ============================================================================
-- 3. TAX CALCULATIONS TABLE
-- ============================================================================
-- Stores detailed tax calculations for orders
CREATE TABLE IF NOT EXISTS tax_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tax_rate_id UUID REFERENCES tax_rates(id),
    tax_type VARCHAR(50) NOT NULL,
    taxable_amount DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,4) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_amounts CHECK (taxable_amount >= 0 AND tax_amount >= 0)
);

-- Indexes for tax calculations
CREATE INDEX IF NOT EXISTS idx_tax_calculations_order ON tax_calculations(order_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_type ON tax_calculations(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_rate ON tax_calculations(tax_rate_id);

-- ============================================================================
-- 4. ENHANCED ORDER ITEMS WITH FINANCIAL DATA
-- ============================================================================
-- Add financial columns to existing order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS margin_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;

-- Create function to calculate margin data
CREATE OR REPLACE FUNCTION calculate_order_item_margins()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total cost
    NEW.total_cost = COALESCE(NEW.cost_per_unit * NEW.quantity, 0);
    
    -- Calculate margin amount (revenue - cost)
    NEW.margin_amount = NEW.subtotal - COALESCE(NEW.total_cost, 0);
    
    -- Calculate margin percentage
    IF NEW.subtotal > 0 THEN
        NEW.margin_percentage = (NEW.margin_amount / NEW.subtotal) * 100;
    ELSE
        NEW.margin_percentage = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to automatically calculate margins
DROP TRIGGER IF EXISTS trigger_calculate_margins ON order_items;
CREATE TRIGGER trigger_calculate_margins
    BEFORE INSERT OR UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_item_margins();

-- ============================================================================
-- 5. COST OF GOODS SOLD (COGS) ENTRIES
-- ============================================================================
-- Track detailed COGS for inventory valuation methods
CREATE TABLE IF NOT EXISTS cogs_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
    unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
    total_cogs DECIMAL(12,2) NOT NULL CHECK (total_cogs >= 0),
    valuation_method VARCHAR(20) NOT NULL DEFAULT 'weighted_average' 
        CHECK (valuation_method IN ('fifo', 'lifo', 'weighted_average', 'specific_identification')),
    cost_date DATE NOT NULL, -- Date of the cost basis
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_total_cogs CHECK (total_cogs = unit_cost * quantity_sold)
);

-- Indexes for COGS entries
CREATE INDEX IF NOT EXISTS idx_cogs_entries_order_item ON cogs_entries(order_item_id);
CREATE INDEX IF NOT EXISTS idx_cogs_entries_product ON cogs_entries(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_cogs_entries_method ON cogs_entries(valuation_method);
CREATE INDEX IF NOT EXISTS idx_cogs_entries_date ON cogs_entries(cost_date);

-- ============================================================================
-- 6. EXPENSE CATEGORIES
-- ============================================================================
-- Categorize business expenses for P&L reporting
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES expense_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for expense categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);

-- Insert default expense categories
INSERT INTO expense_categories (name, description, sort_order) VALUES
('Cost of Goods Sold', 'Direct costs of products sold', 10),
('Marketing', 'Advertising and promotional expenses', 20),
('Operations', 'General business operations', 30),
('Technology', 'Software, hosting, and technical services', 40),
('Professional Services', 'Legal, accounting, consulting', 50),
('Shipping & Fulfillment', 'Shipping, packaging, warehouse costs', 60),
('Administrative', 'Office supplies, miscellaneous admin costs', 70)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 7. EXPENSES TABLE
-- ============================================================================
-- Track business expenses for comprehensive P&L
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    currency CHAR(3) DEFAULT 'USD',
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    vendor_name VARCHAR(200),
    reference_number VARCHAR(100), -- Invoice number, receipt ID, etc.
    payment_method VARCHAR(50),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
    tags TEXT[], -- Array of tags for flexible categorization
    metadata JSONB, -- Flexible storage for additional data
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expenses_tags ON expenses USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(is_recurring, recurring_frequency);

-- ============================================================================
-- 8. FINANCIAL REPORTS TABLE
-- ============================================================================
-- Store generated financial reports
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'profit_loss', 'balance_sheet', 'cash_flow', 'sales_summary', 
        'product_performance', 'customer_analytics', 'tax_summary'
    )),
    period_id UUID REFERENCES financial_periods(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    report_data JSONB NOT NULL, -- The actual report content
    summary_metrics JSONB, -- Key metrics for quick access
    generated_by UUID REFERENCES profiles(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_draft BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    CONSTRAINT valid_report_dates CHECK (end_date >= start_date)
);

-- Indexes for financial reports
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period ON financial_reports(period_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_dates ON financial_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_financial_reports_generated ON financial_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_financial_reports_data ON financial_reports USING GIN(report_data);

-- ============================================================================
-- 9. ENHANCE EXISTING TABLES WITH FINANCIAL COLUMNS
-- ============================================================================

-- Add financial tracking to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS last_cost_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cost_method VARCHAR(20) DEFAULT 'manual' 
    CHECK (cost_method IN ('manual', 'fifo', 'lifo', 'weighted_average')),
ADD COLUMN IF NOT EXISTS min_margin_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_margin_percentage DECIMAL(5,2) DEFAULT 50;

-- Add financial tracking to orders table  
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cost_of_goods DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_margin_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_fees DECIMAL(10,2) DEFAULT 0;

-- Add webhook event tracking (if not exists)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_webhook_event UNIQUE (provider, event_id)
);

-- Add checkout sessions (if not exists)
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    session_id VARCHAR(255),
    currency CHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    items JSONB,
    billing_address JSONB,
    shipping_address JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 10. FINANCIAL CALCULATION FUNCTIONS
-- ============================================================================

-- Function to calculate order financial metrics
CREATE OR REPLACE FUNCTION calculate_order_financials(order_uuid UUID)
RETURNS TABLE (
    order_id UUID,
    total_cogs DECIMAL(12,2),
    gross_profit DECIMAL(12,2),
    gross_margin_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH order_cogs AS (
        SELECT 
            o.id as order_id,
            COALESCE(SUM(oi.total_cost), 0) as total_cost
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = order_uuid
        GROUP BY o.id
    ),
    order_totals AS (
        SELECT 
            o.id as order_id,
            o.subtotal,
            oc.total_cost,
            (o.subtotal - COALESCE(oc.total_cost, 0)) as calculated_gross_profit
        FROM orders o
        LEFT JOIN order_cogs oc ON o.id = oc.order_id
        WHERE o.id = order_uuid
    )
    SELECT 
        ot.order_id,
        ot.total_cost,
        ot.calculated_gross_profit,
        CASE 
            WHEN ot.subtotal > 0 THEN (ot.calculated_gross_profit / ot.subtotal * 100)
            ELSE 0 
        END as margin_percentage
    FROM order_totals ot;
END;
$$ LANGUAGE plpgsql;

-- Function to get period financial summary
CREATE OR REPLACE FUNCTION get_period_financial_summary(
    start_date_param DATE,
    end_date_param DATE
)
RETURNS TABLE (
    total_revenue DECIMAL(12,2),
    total_cogs DECIMAL(12,2),
    gross_profit DECIMAL(12,2),
    gross_margin_percentage DECIMAL(5,2),
    total_orders INTEGER,
    average_order_value DECIMAL(10,2),
    total_expenses DECIMAL(12,2),
    net_profit DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH period_orders AS (
        SELECT 
            COUNT(*) as order_count,
            SUM(subtotal) as revenue,
            SUM(COALESCE(cost_of_goods, 0)) as cogs_total,
            AVG(subtotal) as avg_order_value
        FROM orders
        WHERE DATE(created_at) BETWEEN start_date_param AND end_date_param
        AND status NOT IN ('cancelled', 'refunded')
    ),
    period_expenses AS (
        SELECT COALESCE(SUM(amount), 0) as expense_total
        FROM expenses
        WHERE expense_date BETWEEN start_date_param AND end_date_param
    )
    SELECT 
        COALESCE(po.revenue, 0),
        COALESCE(po.cogs_total, 0),
        COALESCE(po.revenue, 0) - COALESCE(po.cogs_total, 0),
        CASE 
            WHEN po.revenue > 0 THEN ((po.revenue - COALESCE(po.cogs_total, 0)) / po.revenue * 100)
            ELSE 0 
        END,
        COALESCE(po.order_count::INTEGER, 0),
        COALESCE(po.avg_order_value, 0),
        COALESCE(pe.expense_total, 0),
        (COALESCE(po.revenue, 0) - COALESCE(po.cogs_total, 0) - COALESCE(pe.expense_total, 0))
    FROM period_orders po
    CROSS JOIN period_expenses pe;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cogs_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Financial periods policies
CREATE POLICY "financial_periods_admin_full" ON financial_periods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Tax rates policies (read-only for customers, full access for admins)
CREATE POLICY "tax_rates_customer_read" ON tax_rates
    FOR SELECT USING (is_active = true);

CREATE POLICY "tax_rates_admin_full" ON tax_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Tax calculations policies
CREATE POLICY "tax_calculations_admin_full" ON tax_calculations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- COGS entries policies
CREATE POLICY "cogs_entries_admin_full" ON cogs_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Expense categories policies (read for all, modify for admins)
CREATE POLICY "expense_categories_read_all" ON expense_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "expense_categories_admin_modify" ON expense_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Expenses policies
CREATE POLICY "expenses_admin_full" ON expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Financial reports policies
CREATE POLICY "financial_reports_admin_full" ON financial_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Webhook events policies
CREATE POLICY "webhook_events_admin_full" ON webhook_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Checkout sessions policies
CREATE POLICY "checkout_sessions_own_data" ON checkout_sessions
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            session_id = current_setting('app.session_id', true) OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('admin', 'super_admin')
            )
        )
    );

-- ============================================================================
-- 12. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Performance indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_orders_financial_period ON orders(DATE(created_at), status) WHERE status NOT IN ('cancelled', 'refunded');
CREATE INDEX IF NOT EXISTS idx_order_items_financial ON order_items(order_id, subtotal, total_cost);
CREATE INDEX IF NOT EXISTS idx_products_cost_tracking ON products(cost, last_cost_update, cost_method);
CREATE INDEX IF NOT EXISTS idx_expenses_period_category ON expenses(expense_date, category_id, amount);

-- Composite indexes for common financial queries
CREATE INDEX IF NOT EXISTS idx_orders_revenue_analysis ON orders(created_at, status, subtotal, cost_of_goods) 
    WHERE status NOT IN ('cancelled', 'refunded');

CREATE INDEX IF NOT EXISTS idx_order_items_margin_analysis ON order_items(order_id, subtotal, total_cost, margin_percentage);

-- ============================================================================
-- 13. SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample financial periods
INSERT INTO financial_periods (name, period_type, start_date, end_date) VALUES
('Q4 2024', 'quarterly', '2024-10-01', '2024-12-31'),
('Q1 2025', 'quarterly', '2025-01-01', '2025-03-31'),
('January 2025', 'monthly', '2025-01-01', '2025-01-31'),
('February 2025', 'monthly', '2025-02-01', '2025-02-28')
ON CONFLICT (name) DO NOTHING;

-- Insert sample tax rates
INSERT INTO tax_rates (country_code, state_province, tax_type, rate, name, effective_from) VALUES
('US', 'CA', 'sales_tax', 0.0875, 'California Sales Tax', '2024-01-01'),
('US', 'NY', 'sales_tax', 0.08, 'New York Sales Tax', '2024-01-01'),
('US', 'TX', 'sales_tax', 0.0625, 'Texas Sales Tax', '2024-01-01'),
('CA', null, 'gst', 0.05, 'Canada GST', '2024-01-01'),
('GB', null, 'vat', 0.20, 'UK VAT', '2024-01-01')
ON CONFLICT DO NOTHING;

-- Insert sample expenses
INSERT INTO expenses (category_id, amount, description, expense_date, vendor_name) 
SELECT 
    ec.id,
    CASE ec.name
        WHEN 'Marketing' THEN 299.99
        WHEN 'Technology' THEN 49.99
        WHEN 'Professional Services' THEN 500.00
        ELSE 100.00
    END,
    CASE ec.name
        WHEN 'Marketing' THEN 'Google Ads campaign'
        WHEN 'Technology' THEN 'Vercel hosting'
        WHEN 'Professional Services' THEN 'Accounting services'
        ELSE 'Miscellaneous expense'
    END,
    CURRENT_DATE - INTERVAL '30 days',
    CASE ec.name
        WHEN 'Marketing' THEN 'Google LLC'
        WHEN 'Technology' THEN 'Vercel Inc.'
        WHEN 'Professional Services' THEN 'ABC Accounting'
        ELSE 'Various'
    END
FROM expense_categories ec
WHERE ec.name IN ('Marketing', 'Technology', 'Professional Services')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. VALIDATION QUERIES
-- ============================================================================

-- Query to validate schema installation
WITH schema_validation AS (
    SELECT 
        'financial_periods' as table_name,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_periods') as exists
    UNION ALL
    SELECT 'tax_rates', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tax_rates')
    UNION ALL
    SELECT 'tax_calculations', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tax_calculations')
    UNION ALL
    SELECT 'cogs_entries', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cogs_entries')
    UNION ALL
    SELECT 'expense_categories', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_categories')
    UNION ALL
    SELECT 'expenses', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses')
    UNION ALL
    SELECT 'financial_reports', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_reports')
)
SELECT 
    table_name,
    exists,
    CASE WHEN exists THEN '✅ Created' ELSE '❌ Missing' END as status
FROM schema_validation
ORDER BY table_name;

-- Query to test financial calculation functions
SELECT 
    'Financial Functions Test' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'calculate_order_financials') 
        THEN '✅ calculate_order_financials exists'
        ELSE '❌ calculate_order_financials missing'
    END as function_1,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_period_financial_summary') 
        THEN '✅ get_period_financial_summary exists'
        ELSE '❌ get_period_financial_summary missing'
    END as function_2;

-- =====================================================
-- INSTALLATION COMPLETE
-- =====================================================
-- 
-- Next Steps:
-- 1. Execute this SQL in Supabase SQL Editor
-- 2. Update TypeScript types to include new tables
-- 3. Create API endpoints for financial data access
-- 4. Build admin dashboard components for financial reporting
-- 5. Implement automated COGS calculation for new orders
-- 
-- The schema provides:
-- ✅ Comprehensive financial period tracking
-- ✅ Advanced tax calculation and compliance
-- ✅ Detailed COGS tracking with multiple valuation methods  
-- ✅ Expense management for P&L reporting
-- ✅ Financial report generation and storage
-- ✅ Enhanced order financial metrics
-- ✅ Proper RLS security policies
-- ✅ Performance-optimized indexes
-- ✅ Validation and testing queries
-- =====================================================