import pool from './db.js';

const schemaDDL = `
-- 1. TABEL MEJA (TABLES)
CREATE TABLE IF NOT EXISTS tables (
    id VARCHAR(36) PRIMARY KEY,
    table_number VARCHAR(20) NOT NULL UNIQUE,
    qr_code_token VARCHAR(100) NOT NULL UNIQUE,
    capacity INT DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABEL PENGGUNA & PERAN (USERS)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL KATEGORI MENU (CATEGORIES)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL PRODUK / MENU (PRODUCTS)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 5. TABEL VARIAN / ADD-ON MENU (PRODUCT_VARIANTS)
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    variant_group VARCHAR(50) NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    extra_price DECIMAL(10, 2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6. TABEL PESANAN (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    table_id VARCHAR(36) NOT NULL,
    cashier_id VARCHAR(36) NULL,
    customer_name VARCHAR(100) DEFAULT 'Guest',
    order_type VARCHAR(20) DEFAULT 'dine_in',
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    customer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- 7. TABEL ITEM PESANAN (ORDER_ITEMS)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    item_status VARCHAR(20) DEFAULT 'queued',
    item_notes VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 8. TABEL DETAIL VARIAN ITEM PESANAN (ORDER_ITEM_VARIANTS)
CREATE TABLE IF NOT EXISTS order_item_variants (
    id VARCHAR(36) PRIMARY KEY,
    order_item_id VARCHAR(36) NOT NULL,
    variant_group VARCHAR(50) NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    extra_price DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
);

-- 9. TABEL PEMBAYARAN (PAYMENTS)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    cashier_id VARCHAR(36) NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    amount_paid DECIMAL(12, 2) NOT NULL,
    change_amount DECIMAL(12, 2) DEFAULT 0.00,
    gateway_transaction_id VARCHAR(100) NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id)
);
`;

export async function runMigration() {
  try {
    console.log('🚀 Running MySQL Migration...');
    await pool.query(schemaDDL);
    console.log('✅ All 9 Tables Created Successfully!');

    // Seed Categories if empty
    const [catRows] = await pool.query('SELECT COUNT(*) as count FROM categories');
    if (catRows[0].count === 0) {
      console.log('🌱 Seeding Categories...');
      await pool.query(`
        INSERT INTO categories (id, name, slug, display_order) VALUES
        ('coffee', 'Espresso & Coffee', 'coffee', 1),
        ('non-coffee', 'Non-Coffee', 'non-coffee', 2),
        ('food', 'Makanan Berat', 'food', 3),
        ('snack', 'Snack & Pastry', 'snack', 4)
      `);
    }

    // Seed Tables if empty
    const [tblRows] = await pool.query('SELECT COUNT(*) as count FROM tables');
    if (tblRows[0].count === 0) {
      console.log('🌱 Seeding Tables...');
      await pool.query(`
        INSERT INTO tables (id, table_number, qr_code_token, capacity, status) VALUES
        ('tbl-1', 'M-01', 'QR-CAFFE-M01', 2, 'available'),
        ('tbl-2', 'M-02', 'QR-CAFFE-M02', 4, 'occupied'),
        ('tbl-3', 'M-03', 'QR-CAFFE-M03', 4, 'available'),
        ('tbl-4', 'M-04', 'QR-CAFFE-M04', 6, 'available'),
        ('tbl-5', 'M-05', 'QR-CAFFE-M05', 2, 'available'),
        ('tbl-6', 'M-06', 'QR-CAFFE-M06', 4, 'occupied')
      `);
    }

    // Seed Default Users if empty
    const [usrRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (usrRows[0].count === 0) {
      console.log('🌱 Seeding Users...');
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, role) VALUES
        ('usr-admin', 'Admin Resto', 'admin@caffe.com', 'hash_admin', 'admin'),
        ('usr-cashier1', 'Kasir #01', 'kasir1@caffe.com', 'hash_kasir', 'cashier')
      `);
    }

    // Seed Products if empty
    const [prodRows] = await pool.query('SELECT COUNT(*) as count FROM products');
    if (prodRows[0].count === 0) {
      console.log('🌱 Seeding Products & Variants...');
      await pool.query(`
        INSERT INTO products (id, category_id, name, description, price, image_url, is_available) VALUES
        ('prod-1', 'coffee', 'Kopi Kenangan Aren (Iced)', 'Espresso ganda dengan susu segar organik dan gula aren asli Tuban.', 28000.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', TRUE),
        ('prod-2', 'coffee', 'Caramel Macchiato', 'Espresso rich disiram syrup vanilla, steamed milk, dan drizzle caramel pekat.', 36000.00, 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80', TRUE),
        ('prod-3', 'coffee', 'Manual Brew Single Origin', 'Biji kopi Pilihan (Gayo / Toraja / Kintamani) metode V60 pour over.', 32000.00, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80', TRUE),
        ('prod-4', 'non-coffee', 'Matcha Latte Japan', 'Pure Uji Matcha kelas seremonial dipadu susu segar lembut.', 34000.00, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80', TRUE),
        ('prod-5', 'non-coffee', 'Artisan Chocolate Signature', 'Cokelat Belgia 70% dark disajikan hangat atau dingin dengan foam lembut.', 35000.00, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80', TRUE),
        ('prod-6', 'food', 'Nasi Goreng Special Caffe', 'Nasi goreng rempah nusantara dengan ayam suwir, telur mata sapi, kerupuk, dan acai.', 42000.00, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80', TRUE),
        ('prod-7', 'food', 'Beef Truffle Burger', '100% Australian Beef Patty dengan saus truffle aioli, keju melt, dan french fries.', 58000.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', TRUE),
        ('prod-8', 'snack', 'Croissant Butter Original', 'Flaky pastry Prancis panggang segar tiap pagi dengan aroma mentega kaya.', 24000.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80', TRUE),
        ('prod-9', 'snack', 'Truffle French Fries', 'Kentang goreng renyah ditaburi minyak truffle murni dan keju Parmesan parut.', 29000.00, 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80', TRUE)
      `);

      await pool.query(`
        INSERT INTO product_variants (id, product_id, variant_group, variant_name, extra_price) VALUES
        ('v-1', 'prod-1', 'Temperature', 'Es (Iced)', 0.00),
        ('v-2', 'prod-1', 'Temperature', 'Panas (Hot)', 0.00),
        ('v-3', 'prod-1', 'SugarLevel', 'Normal Sugar (100%)', 0.00),
        ('v-4', 'prod-1', 'SugarLevel', 'Less Sugar (50%)', 0.00),
        ('v-5', 'prod-1', 'Topping', 'Extra Espresso Shot', 6000.00),
        ('v-6', 'prod-2', 'Temperature', 'Panas (Hot)', 0.00),
        ('v-7', 'prod-2', 'Temperature', 'Es (Iced)', 2000.00),
        ('v-8', 'prod-6', 'Spicy', 'Sedang (Level 1)', 0.00),
        ('v-9', 'prod-6', 'Spicy', 'Pedas (Level 3)', 0.00)
      `);
    }

    console.log('🎉 Seed Data Initialized Successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
  }
}

if (process.argv[2] === '--run') {
  runMigration().then(() => process.exit(0));
}
