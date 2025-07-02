-- CultureMade E-Commerce Platform - Row Level Security Policies
-- Migration: 002_row_level_security
-- Run this in your Supabase SQL Editor AFTER running the initial schema
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID) RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = user_id
            AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- PROFILES POLICIES
-- Users can view and update own profile
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- Users can insert their own profile (for new registrations)
CREATE POLICY "Users can insert own profile" ON profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles FOR
SELECT USING (is_admin(auth.uid()));
-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON profiles FOR
UPDATE USING (is_admin(auth.uid()));
-- PRODUCTS POLICIES
-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON products FOR
SELECT USING (
        status = 'active'
        OR is_admin(auth.uid())
    );
-- Admins can manage all products
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (is_admin(auth.uid()));
-- PRODUCT_VARIANTS POLICIES
-- Anyone can view variants of active products
CREATE POLICY "Anyone can view product variants" ON product_variants FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM products
            WHERE products.id = product_variants.product_id
                AND (
                    products.status = 'active'
                    OR is_admin(auth.uid())
                )
        )
    );
-- Admins can manage all product variants
CREATE POLICY "Admins can manage product variants" ON product_variants FOR ALL USING (is_admin(auth.uid()));
-- PRODUCT_IMAGES POLICIES
-- Anyone can view images of active products
CREATE POLICY "Anyone can view product images" ON product_images FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM products
            WHERE products.id = product_images.product_id
                AND (
                    products.status = 'active'
                    OR is_admin(auth.uid())
                )
        )
    );
-- Admins can manage all product images
CREATE POLICY "Admins can manage product images" ON product_images FOR ALL USING (is_admin(auth.uid()));
-- CATEGORIES POLICIES
-- Anyone can view categories
CREATE POLICY "Anyone can view categories" ON categories FOR
SELECT USING (true);
-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (is_admin(auth.uid()));
-- PRODUCT_CATEGORIES POLICIES
-- Anyone can view product-category relationships
CREATE POLICY "Anyone can view product categories" ON product_categories FOR
SELECT USING (true);
-- Admins can manage product-category relationships
CREATE POLICY "Admins can manage product categories" ON product_categories FOR ALL USING (is_admin(auth.uid()));
-- COLLECTIONS POLICIES
-- Anyone can view active collections
CREATE POLICY "Anyone can view collections" ON collections FOR
SELECT USING (
        status = 'active'
        OR is_admin(auth.uid())
    );
-- Admins can manage collections
CREATE POLICY "Admins can manage collections" ON collections FOR ALL USING (is_admin(auth.uid()));
-- PRODUCT_COLLECTIONS POLICIES
-- Anyone can view product-collection relationships
CREATE POLICY "Anyone can view product collections" ON product_collections FOR
SELECT USING (true);
-- Admins can manage product-collection relationships
CREATE POLICY "Admins can manage product collections" ON product_collections FOR ALL USING (is_admin(auth.uid()));
-- ADDRESSES POLICIES
-- Users can view and manage own addresses
CREATE POLICY "Users can view own addresses" ON addresses FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON addresses FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON addresses FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE USING (auth.uid() = user_id);
-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses" ON addresses FOR
SELECT USING (is_admin(auth.uid()));
-- Admins can update any address
CREATE POLICY "Admins can update any address" ON addresses FOR
UPDATE USING (is_admin(auth.uid()));
-- CART_ITEMS POLICIES
-- Users can manage own cart items
CREATE POLICY "Users can view own cart" ON cart_items FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart items" ON cart_items FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart items" ON cart_items FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart items" ON cart_items FOR DELETE USING (auth.uid() = user_id);
-- Anonymous users can manage cart by session_id
CREATE POLICY "Anonymous users can manage cart by session" ON cart_items FOR ALL USING (
    session_id IS NOT NULL
    AND user_id IS NULL
);
-- Admins can view all cart items
CREATE POLICY "Admins can view all cart items" ON cart_items FOR
SELECT USING (is_admin(auth.uid()));
-- ORDERS POLICIES
-- Users can view own orders
CREATE POLICY "Users can view own orders" ON orders FOR
SELECT USING (auth.uid() = user_id);
-- Users can insert orders (for checkout)
CREATE POLICY "Users can create orders" ON orders FOR
INSERT WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL
    );
-- Admins can view and manage all orders
CREATE POLICY "Admins can view all orders" ON orders FOR
SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update orders" ON orders FOR
UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete orders" ON orders FOR DELETE USING (is_admin(auth.uid()));
-- ORDER_ITEMS POLICIES
-- Users can view own order items
CREATE POLICY "Users can view own order items" ON order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE orders.id = order_items.order_id
                AND orders.user_id = auth.uid()
        )
    );
-- Users can insert order items (during checkout)
CREATE POLICY "Users can create order items" ON order_items FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE orders.id = order_items.order_id
                AND (
                    orders.user_id = auth.uid()
                    OR orders.user_id IS NULL
                )
        )
    );
-- Admins can manage all order items
CREATE POLICY "Admins can manage order items" ON order_items FOR ALL USING (is_admin(auth.uid()));
-- PAYMENTS POLICIES
-- Users can view payments for own orders
CREATE POLICY "Users can view own payments" ON payments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE orders.id = payments.order_id
                AND orders.user_id = auth.uid()
        )
    );
-- System can insert payments (via API/webhook)
CREATE POLICY "System can create payments" ON payments FOR
INSERT WITH CHECK (true);
-- Admins can view and manage all payments
CREATE POLICY "Admins can view all payments" ON payments FOR
SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update payments" ON payments FOR
UPDATE USING (is_admin(auth.uid()));
-- SHIPPING_METHODS POLICIES
-- Anyone can view active shipping methods
CREATE POLICY "Anyone can view shipping methods" ON shipping_methods FOR
SELECT USING (
        is_active = true
        OR is_admin(auth.uid())
    );
-- Admins can manage shipping methods
CREATE POLICY "Admins can manage shipping methods" ON shipping_methods FOR ALL USING (is_admin(auth.uid()));
-- SHIPMENTS POLICIES
-- Users can view shipments for own orders
CREATE POLICY "Users can view own shipments" ON shipments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE orders.id = shipments.order_id
                AND orders.user_id = auth.uid()
        )
    );
-- Admins can manage all shipments
CREATE POLICY "Admins can manage shipments" ON shipments FOR ALL USING (is_admin(auth.uid()));
-- DISCOUNTS POLICIES
-- Anyone can view active discounts (for applying coupons)
CREATE POLICY "Anyone can view active discounts" ON discounts FOR
SELECT USING (
        is_active = true
        OR is_admin(auth.uid())
    );
-- Admins can manage discounts
CREATE POLICY "Admins can manage discounts" ON discounts FOR ALL USING (is_admin(auth.uid()));
-- REVIEWS POLICIES
-- Anyone can view published reviews
CREATE POLICY "Anyone can view published reviews" ON reviews FOR
SELECT USING (
        is_published = true
        OR auth.uid() = user_id
        OR is_admin(auth.uid())
    );
-- Users can create reviews for products they've purchased
CREATE POLICY "Users can create reviews" ON reviews FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update own reviews
CREATE POLICY "Users can update own reviews" ON reviews FOR
UPDATE USING (auth.uid() = user_id);
-- Users can delete own reviews
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);
-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL USING (is_admin(auth.uid()));
-- INVENTORY_MOVEMENTS POLICIES
-- Only admins can view inventory movements
CREATE POLICY "Admins can view inventory movements" ON inventory_movements FOR
SELECT USING (is_admin(auth.uid()));
-- Only admins can create inventory movements
CREATE POLICY "Admins can create inventory movements" ON inventory_movements FOR
INSERT WITH CHECK (is_admin(auth.uid()));
-- ANALYTICS_EVENTS POLICIES
-- Users can insert their own analytics events
CREATE POLICY "Users can create analytics events" ON analytics_events FOR
INSERT WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL
    );
-- Only admins can view analytics events
CREATE POLICY "Admins can view analytics events" ON analytics_events FOR
SELECT USING (is_admin(auth.uid()));
-- ADMIN_LOGS POLICIES
-- Only admins can view admin logs
CREATE POLICY "Admins can view admin logs" ON admin_logs FOR
SELECT USING (is_admin(auth.uid()));
-- Only admins can create admin logs
CREATE POLICY "Admins can create admin logs" ON admin_logs FOR
INSERT WITH CHECK (is_admin(auth.uid()));
-- Create a trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO profiles (id, role, full_name)
VALUES (
        NEW.id,
        'customer',
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- Create admin user function (to be used once to create first admin)
CREATE OR REPLACE FUNCTION create_admin_user(user_email TEXT) RETURNS VOID AS $$ BEGIN
UPDATE profiles
SET role = 'admin'
WHERE id = (
        SELECT id
        FROM auth.users
        WHERE email = user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;