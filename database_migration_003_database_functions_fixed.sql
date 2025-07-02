-- CultureMade E-Commerce Platform - Database Functions (FIXED)
-- Migration: 003_database_functions_fixed
-- Run this in your Supabase SQL Editor AFTER running schema and RLS migrations
-- =================================================================================
-- INVENTORY MANAGEMENT FUNCTIONS
-- =================================================================================
-- Function to check product availability
CREATE OR REPLACE FUNCTION check_product_availability(p_variant_id UUID, p_quantity INTEGER) RETURNS BOOLEAN AS $$
DECLARE available_quantity INTEGER;
allows_backorder BOOLEAN;
BEGIN
SELECT pv.quantity,
    COALESCE(p.allow_backorder, false) INTO available_quantity,
    allows_backorder
FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
WHERE pv.id = p_variant_id;
IF available_quantity IS NULL THEN RETURN false;
-- Product variant not found
END IF;
IF available_quantity >= p_quantity THEN RETURN true;
-- Sufficient stock
END IF;
RETURN allows_backorder;
-- Return backorder status if insufficient stock
END;
$$ LANGUAGE plpgsql;
-- Function to update inventory when order is placed
CREATE OR REPLACE FUNCTION update_inventory_on_order(
        p_variant_id UUID,
        p_quantity INTEGER,
        p_order_id UUID,
        p_user_id UUID DEFAULT NULL
    ) RETURNS VOID AS $$ BEGIN -- Decrease product variant quantity
UPDATE product_variants
SET quantity = quantity - p_quantity
WHERE id = p_variant_id;
-- Record inventory movement
INSERT INTO inventory_movements (
        variant_id,
        type,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_by
    )
VALUES (
        p_variant_id,
        'sale',
        - p_quantity,
        'order',
        p_order_id,
        'Sale - Order placed',
        p_user_id
    );
END;
$$ LANGUAGE plpgsql;
-- Function to restore inventory when order is cancelled
CREATE OR REPLACE FUNCTION restore_inventory_on_cancel(
        p_order_id UUID,
        p_user_id UUID DEFAULT NULL
    ) RETURNS VOID AS $$
DECLARE order_item RECORD;
BEGIN FOR order_item IN
SELECT variant_id,
    quantity
FROM order_items
WHERE order_id = p_order_id LOOP -- Increase product variant quantity
UPDATE product_variants
SET quantity = quantity + order_item.quantity
WHERE id = order_item.variant_id;
-- Record inventory movement
INSERT INTO inventory_movements (
        variant_id,
        type,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_by
    )
VALUES (
        order_item.variant_id,
        'return',
        order_item.quantity,
        'order',
        p_order_id,
        'Return - Order cancelled',
        p_user_id
    );
END LOOP;
END;
$$ LANGUAGE plpgsql;
-- =================================================================================
-- CART MANAGEMENT FUNCTIONS
-- =================================================================================
-- Function to add item to cart
CREATE OR REPLACE FUNCTION add_to_cart(
        p_variant_id UUID,
        p_user_id UUID DEFAULT NULL,
        p_session_id TEXT DEFAULT NULL,
        p_quantity INTEGER DEFAULT 1
    ) RETURNS UUID AS $$
DECLARE cart_item_id UUID;
existing_quantity INTEGER := 0;
BEGIN -- Check if item already exists in cart
SELECT id,
    quantity INTO cart_item_id,
    existing_quantity
FROM cart_items
WHERE (
        (
            p_user_id IS NOT NULL
            AND user_id = p_user_id
        )
        OR (
            p_session_id IS NOT NULL
            AND session_id = p_session_id
        )
    )
    AND variant_id = p_variant_id;
IF cart_item_id IS NOT NULL THEN -- Update existing cart item
UPDATE cart_items
SET quantity = existing_quantity + p_quantity,
    updated_at = NOW()
WHERE id = cart_item_id;
ELSE -- Insert new cart item
INSERT INTO cart_items (user_id, session_id, variant_id, quantity)
VALUES (
        p_user_id,
        p_session_id,
        p_variant_id,
        p_quantity
    )
RETURNING id INTO cart_item_id;
END IF;
RETURN cart_item_id;
END;
$$ LANGUAGE plpgsql;
-- Function to update cart item quantity
CREATE OR REPLACE FUNCTION update_cart_item(p_cart_item_id UUID, p_quantity INTEGER) RETURNS BOOLEAN AS $$ BEGIN IF p_quantity <= 0 THEN
DELETE FROM cart_items
WHERE id = p_cart_item_id;
ELSE
UPDATE cart_items
SET quantity = p_quantity,
    updated_at = NOW()
WHERE id = p_cart_item_id;
END IF;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
-- Function to merge anonymous cart with user cart on login
CREATE OR REPLACE FUNCTION merge_cart_on_login(p_user_id UUID, p_session_id TEXT) RETURNS VOID AS $$
DECLARE session_item RECORD;
existing_quantity INTEGER;
BEGIN FOR session_item IN
SELECT variant_id,
    quantity
FROM cart_items
WHERE session_id = p_session_id
    AND user_id IS NULL LOOP -- Check if user already has this item in cart
SELECT quantity INTO existing_quantity
FROM cart_items
WHERE user_id = p_user_id
    AND variant_id = session_item.variant_id;
IF existing_quantity IS NOT NULL THEN -- Update existing user cart item
UPDATE cart_items
SET quantity = existing_quantity + session_item.quantity,
    updated_at = NOW()
WHERE user_id = p_user_id
    AND variant_id = session_item.variant_id;
ELSE -- Move session item to user cart
UPDATE cart_items
SET user_id = p_user_id,
    session_id = NULL,
    updated_at = NOW()
WHERE session_id = p_session_id
    AND variant_id = session_item.variant_id
    AND user_id IS NULL;
END IF;
END LOOP;
-- Delete any remaining session items
DELETE FROM cart_items
WHERE session_id = p_session_id
    AND user_id IS NULL;
END;
$$ LANGUAGE plpgsql;
-- Function to get cart total
CREATE OR REPLACE FUNCTION get_cart_total(
        p_user_id UUID DEFAULT NULL,
        p_session_id TEXT DEFAULT NULL
    ) RETURNS DECIMAL(10, 2) AS $$
DECLARE total_amount DECIMAL(10, 2) := 0;
BEGIN
SELECT COALESCE(
        SUM(
            ci.quantity * COALESCE(pv.price, p.price)
        ),
        0
    ) INTO total_amount
FROM cart_items ci
    JOIN product_variants pv ON pv.id = ci.variant_id
    JOIN products p ON p.id = pv.product_id
WHERE (
        (
            p_user_id IS NOT NULL
            AND ci.user_id = p_user_id
        )
        OR (
            p_session_id IS NOT NULL
            AND ci.session_id = p_session_id
        )
    );
RETURN total_amount;
END;
$$ LANGUAGE plpgsql;
-- =================================================================================
-- ORDER PROCESSING FUNCTIONS
-- =================================================================================
-- Function to create order from cart (FIXED parameter ordering)
CREATE OR REPLACE FUNCTION create_order_from_cart(
        p_email TEXT,
        p_user_id UUID DEFAULT NULL,
        p_session_id TEXT DEFAULT NULL,
        p_phone TEXT DEFAULT NULL,
        p_billing_address_id UUID DEFAULT NULL,
        p_shipping_address_id UUID DEFAULT NULL,
        p_shipping_amount DECIMAL(10, 2) DEFAULT 0,
        p_tax_amount DECIMAL(10, 2) DEFAULT 0,
        p_discount_amount DECIMAL(10, 2) DEFAULT 0
    ) RETURNS UUID AS $$
DECLARE order_id UUID;
order_number TEXT;
subtotal DECIMAL(10, 2) := 0;
total_amount DECIMAL(10, 2);
cart_item RECORD;
BEGIN -- Generate order number
SELECT generate_order_number() INTO order_number;
-- Calculate subtotal from cart
SELECT get_cart_total(p_user_id, p_session_id) INTO subtotal;
-- Calculate total
total_amount := subtotal + p_shipping_amount + p_tax_amount - p_discount_amount;
-- Create order
INSERT INTO orders (
        order_number,
        user_id,
        email,
        phone,
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount,
        total_amount,
        billing_address_id,
        shipping_address_id
    )
VALUES (
        order_number,
        p_user_id,
        p_email,
        p_phone,
        subtotal,
        p_tax_amount,
        p_shipping_amount,
        p_discount_amount,
        total_amount,
        p_billing_address_id,
        p_shipping_address_id
    )
RETURNING id INTO order_id;
-- Copy cart items to order items
FOR cart_item IN
SELECT ci.variant_id,
    ci.product_id,
    ci.quantity,
    p.name as product_name,
    pv.name as variant_name,
    COALESCE(pv.price, p.price) as price
FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN product_variants pv ON pv.id = ci.variant_id
WHERE (
        (
            p_user_id IS NOT NULL
            AND ci.user_id = p_user_id
        )
        OR (
            p_session_id IS NOT NULL
            AND ci.session_id = p_session_id
        )
    ) LOOP -- Create order item
INSERT INTO order_items (
        order_id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        price,
        quantity,
        subtotal
    )
VALUES (
        order_id,
        cart_item.product_id,
        cart_item.variant_id,
        cart_item.product_name,
        cart_item.variant_name,
        cart_item.price,
        cart_item.quantity,
        cart_item.price * cart_item.quantity
    );
-- Update inventory
PERFORM update_inventory_on_order(
    cart_item.variant_id,
    cart_item.quantity,
    order_id,
    p_user_id
);
END LOOP;
-- Clear cart
DELETE FROM cart_items
WHERE (
        (
            p_user_id IS NOT NULL
            AND user_id = p_user_id
        )
        OR (
            p_session_id IS NOT NULL
            AND session_id = p_session_id
        )
    );
RETURN order_id;
END;
$$ LANGUAGE plpgsql;
-- Function to update order status
CREATE OR REPLACE FUNCTION update_order_status(
        p_order_id UUID,
        p_status TEXT DEFAULT NULL,
        p_payment_status TEXT DEFAULT NULL,
        p_fulfillment_status TEXT DEFAULT NULL,
        p_admin_id UUID DEFAULT NULL
    ) RETURNS BOOLEAN AS $$
DECLARE old_status TEXT;
new_status TEXT;
BEGIN -- Get current status for logging
SELECT status INTO old_status
FROM orders
WHERE id = p_order_id;
-- Update order
UPDATE orders
SET status = COALESCE(p_status, status),
    payment_status = COALESCE(p_payment_status, payment_status),
    fulfillment_status = COALESCE(p_fulfillment_status, fulfillment_status),
    updated_at = NOW()
WHERE id = p_order_id;
IF NOT FOUND THEN RETURN false;
END IF;
-- Get new status for logging
SELECT status INTO new_status
FROM orders
WHERE id = p_order_id;
-- Log admin action if admin is updating
IF p_admin_id IS NOT NULL THEN
INSERT INTO admin_logs (
        admin_id,
        action,
        resource_type,
        resource_id,
        details
    )
VALUES (
        p_admin_id,
        'update_order_status',
        'order',
        p_order_id,
        jsonb_build_object(
            'old_status',
            old_status,
            'new_status',
            new_status,
            'payment_status',
            p_payment_status,
            'fulfillment_status',
            p_fulfillment_status
        )
    );
END IF;
-- If order is cancelled, restore inventory
IF p_status = 'cancelled' THEN PERFORM restore_inventory_on_cancel(p_order_id, p_admin_id);
END IF;
RETURN true;
END;
$$ LANGUAGE plpgsql;
-- =================================================================================
-- ANALYTICS FUNCTIONS
-- =================================================================================
-- Function to track analytics event
CREATE OR REPLACE FUNCTION track_analytics_event(
        p_event_name TEXT,
        p_user_id UUID DEFAULT NULL,
        p_session_id TEXT DEFAULT NULL,
        p_properties JSONB DEFAULT '{}'::jsonb
    ) RETURNS UUID AS $$
DECLARE event_id UUID;
BEGIN
INSERT INTO analytics_events (
        event_name,
        user_id,
        session_id,
        properties
    )
VALUES (
        p_event_name,
        p_user_id,
        p_session_id,
        p_properties
    )
RETURNING id INTO event_id;
RETURN event_id;
END;
$$ LANGUAGE plpgsql;
-- Function to get sales analytics
CREATE OR REPLACE FUNCTION get_sales_analytics(
        p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
        p_end_date DATE DEFAULT CURRENT_DATE
    ) RETURNS TABLE (
        date DATE,
        total_orders BIGINT,
        total_revenue DECIMAL(10, 2),
        avg_order_value DECIMAL(10, 2)
    ) AS $$ BEGIN RETURN QUERY
SELECT DATE(o.created_at) as date,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(AVG(o.total_amount), 0) as avg_order_value
FROM orders o
WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    AND o.status NOT IN ('cancelled', 'refunded')
GROUP BY DATE(o.created_at)
ORDER BY date;
END;
$$ LANGUAGE plpgsql;
-- Function to get product performance analytics
CREATE OR REPLACE FUNCTION get_product_performance(
        p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
        p_end_date DATE DEFAULT CURRENT_DATE,
        p_limit INTEGER DEFAULT 10
    ) RETURNS TABLE (
        product_id UUID,
        product_name TEXT,
        total_sold BIGINT,
        total_revenue DECIMAL(10, 2)
    ) AS $$ BEGIN RETURN QUERY
SELECT p.id as product_id,
    p.name as product_name,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    COALESCE(SUM(oi.subtotal), 0) as total_revenue
FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id
WHERE (
        o.created_at IS NULL
        OR DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    )
    AND (
        o.status IS NULL
        OR o.status NOT IN ('cancelled', 'refunded')
    )
GROUP BY p.id,
    p.name
ORDER BY total_revenue DESC,
    total_sold DESC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
-- =================================================================================
-- UTILITY FUNCTIONS
-- =================================================================================
-- Function to clean up old analytics events (for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events(p_days_to_keep INTEGER DEFAULT 365) RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
DELETE FROM analytics_events
WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
-- Function to validate product slug uniqueness
CREATE OR REPLACE FUNCTION validate_product_slug(
        p_slug TEXT,
        p_product_id UUID DEFAULT NULL
    ) RETURNS BOOLEAN AS $$
DECLARE existing_count INTEGER;
BEGIN
SELECT COUNT(*) INTO existing_count
FROM products
WHERE slug = p_slug
    AND (
        p_product_id IS NULL
        OR id != p_product_id
    );
RETURN existing_count = 0;
END;
$$ LANGUAGE plpgsql;
-- Function to calculate shipping cost (basic implementation)
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
        p_shipping_method_id UUID,
        p_cart_total DECIMAL(10, 2),
        p_item_count INTEGER
    ) RETURNS DECIMAL(10, 2) AS $$
DECLARE shipping_cost DECIMAL(10, 2) := 0;
method_record RECORD;
BEGIN
SELECT base_rate,
    per_item_rate,
    min_order_amount,
    max_order_amount,
    is_active INTO method_record
FROM shipping_methods
WHERE id = p_shipping_method_id;
-- Check if shipping method exists and is active
IF method_record IS NULL
OR NOT method_record.is_active THEN RETURN NULL;
END IF;
-- Check order amount limits
IF method_record.min_order_amount IS NOT NULL
AND p_cart_total < method_record.min_order_amount THEN RETURN NULL;
END IF;
IF method_record.max_order_amount IS NOT NULL
AND p_cart_total > method_record.max_order_amount THEN RETURN NULL;
END IF;
-- Calculate shipping cost
shipping_cost := method_record.base_rate;
IF method_record.per_item_rate IS NOT NULL THEN shipping_cost := shipping_cost + (method_record.per_item_rate * p_item_count);
END IF;
RETURN shipping_cost;
END;
$$ LANGUAGE plpgsql;