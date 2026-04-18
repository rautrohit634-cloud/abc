-- =====================================================
-- AAKRUTI SHRINGAR – PostgreSQL Setup Script
-- Run: psql -U postgres -f setup.sql
-- =====================================================

-- Create database
CREATE DATABASE aakruti_shringar;

\c aakruti_shringar;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120)  NOT NULL,
    phone           VARCHAR(20)   NOT NULL,
    address         TEXT          NOT NULL,
    city            VARCHAR(80)   NOT NULL,
    pincode         VARCHAR(10)   NOT NULL,
    products        TEXT          NOT NULL,
    cart_items      TEXT,
    total_amount    NUMERIC(10,2) DEFAULT 0,
    payment_method  VARCHAR(30)   DEFAULT 'cod',
    status          VARCHAR(30)   DEFAULT 'pending',
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(200) NOT NULL,
    phone       VARCHAR(20),
    message     TEXT         NOT NULL,
    created_at  TIMESTAMP    DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)  NOT NULL,
    category    VARCHAR(50)   NOT NULL,
    description TEXT,
    price       NUMERIC(10,2) NOT NULL,
    emoji       VARCHAR(10),
    in_stock    BOOLEAN       DEFAULT TRUE,
    created_at  TIMESTAMP     DEFAULT NOW()
);

-- Seed products
INSERT INTO products (name, category, description, price, emoji) VALUES
    ('Velvet Matte Lipstick',       'lips',      'Long-lasting 12hr formula in 24 shades',     499,   '💄'),
    ('Glossy Lip Butter',            'lips',      'Hydrating & plumping, 8 sheer shades',        349,   '🫦'),
    ('Vitamin C Brightening Serum',  'skin',      'Fade dark spots, boost radiance daily',       899,   '🧴'),
    ('Kumkumadi Night Cream',         'skin',      'Ayurvedic saffron-based anti-aging cream',   749,   '🌿'),
    ('Kohl Kajal Intense',            'eyes',      'Smudge-proof 24hr waterproof formula',       299,   '👁️'),
    ('Shimmer Eye Palette',           'eyes',      '12 ultra-pigmented warm nude shades',        1199,  '✨'),
    ('Rose Oud Eau de Parfum',        'fragrance', 'Rich floral oriental, 50ml long-lasting',   1599,  '🌸'),
    ('Aqua Bloom Body Mist',          'fragrance', 'Light fresh citrus, perfect daily spritz',   449,   '💎')
ON CONFLICT DO NOTHING;

-- Useful views
CREATE OR REPLACE VIEW pending_orders AS
    SELECT id, name, phone, city, products, total_amount, created_at
    FROM orders WHERE status = 'pending'
    ORDER BY created_at DESC;

CREATE OR REPLACE VIEW order_summary AS
    SELECT
        DATE(created_at)  AS order_date,
        COUNT(*)          AS total_orders,
        SUM(total_amount) AS revenue
    FROM orders
    GROUP BY 1
    ORDER BY 1 DESC;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone    ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

\echo '✅ AAKRUTI SHRINGAR database setup complete!'
