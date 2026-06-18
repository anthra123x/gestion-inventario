-- Drop ecommerce tables and trigger
DROP TRIGGER IF EXISTS trigger_product_ecommerce_updated_at ON product_ecommerce;
DROP FUNCTION IF EXISTS update_product_ecommerce_updated_at;
DROP TABLE IF EXISTS product_media CASCADE;
DROP TABLE IF EXISTS product_ecommerce CASCADE;

-- Drop orders tables
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
