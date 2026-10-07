import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'caffe',
  password: process.env.DB_PASSWORD || 'Jazman@271998',
  database: process.env.DB_NAME || 'caffe',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  connectTimeout: 3000
});

// Mock In-Memory Store for Graceful Offline Fallback
let isDbConnected = false;

// Initial Seed Data
const mockData = {
  categories: [
    { id: 'coffee', name: 'Espresso & Coffee', slug: 'coffee', display_order: 1 },
    { id: 'non-coffee', name: 'Non-Coffee', slug: 'non-coffee', display_order: 2 },
    { id: 'food', name: 'Makanan Berat', slug: 'food', display_order: 3 },
    { id: 'snack', name: 'Snack & Pastry', slug: 'snack', display_order: 4 }
  ],
  tables: [
    { id: 'tbl-1', table_number: 'M-01', qr_code_token: 'QR-CAFFE-M01', capacity: 2, status: 'available' },
    { id: 'tbl-2', table_number: 'M-02', qr_code_token: 'QR-CAFFE-M02', capacity: 4, status: 'occupied' },
    { id: 'tbl-3', table_number: 'M-03', qr_code_token: 'QR-CAFFE-M03', capacity: 4, status: 'available' },
    { id: 'tbl-4', table_number: 'M-04', qr_code_token: 'QR-CAFFE-M04', capacity: 6, status: 'available' },
    { id: 'tbl-5', table_number: 'M-05', qr_code_token: 'QR-CAFFE-M05', capacity: 2, status: 'available' },
    { id: 'tbl-6', table_number: 'M-06', qr_code_token: 'QR-CAFFE-M06', capacity: 4, status: 'occupied' }
  ],
  users: [
    { id: 'usr-admin', name: 'Admin Resto', email: 'admin@caffe.com', phone: '08123456789', role: 'admin', is_active: 1 },
    { id: 'usr-cashier1', name: 'Kasir #01', email: 'kasir1@caffe.com', phone: '08987654321', role: 'cashier', is_active: 1 }
  ],
  products: [
    { id: 'prod-1', category_id: 'coffee', name: 'Kopi Kenangan Aren (Iced)', description: 'Espresso ganda dengan susu segar organik dan gula aren asli Tuban.', price: 28000.00, image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() },
    { id: 'prod-2', category_id: 'coffee', name: 'Caramel Macchiato', description: 'Espresso rich disiram syrup vanilla, steamed milk, dan drizzle caramel pekat.', price: 36000.00, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() },
    { id: 'prod-3', category_id: 'coffee', name: 'Manual Brew Single Origin', description: 'Biji kopi Pilihan (Gayo / Toraja / Kintamani) metode V60 pour over.', price: 32000.00, image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() },
    { id: 'prod-4', category_id: 'non-coffee', name: 'Matcha Latte Japan', description: 'Pure Uji Matcha kelas seremonial dipadu susu segar lembut.', price: 34000.00, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() },
    { id: 'prod-5', category_id: 'non-coffee', name: 'Artisan Chocolate Signature', description: 'Cokelat Belgia 70% dark disajikan hangat atau dingin dengan foam lembut.', price: 35000.00, image_url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() },
    { id: 'prod-6', category_id: 'food', name: 'Nasi Goreng Special Caffe', description: 'Nasi goreng rempah nusantara dengan ayam suwir, telur mata sapi, kerupuk, dan acai.', price: 42000.00, image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() },
    { id: 'prod-7', category_id: 'food', name: 'Beef Truffle Burger', description: '100% Australian Beef Patty dengan saus truffle aioli, keju melt, dan french fries.', price: 58000.00, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() },
    { id: 'prod-8', category_id: 'snack', name: 'Croissant Butter Original', description: 'Flaky pastry Prancis panggang segar tiap pagi dengan aroma mentega kaya.', price: 24000.00, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() },
    { id: 'prod-9', category_id: 'snack', name: 'Truffle French Fries', description: 'Kentang goreng renyah ditaburi minyak truffle murni dan keju Parmesan parut.', price: 29000.00, image_url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80', is_available: 1, created_at: new Date() }
  ],
  product_variants: [
    { id: 'v-1', product_id: 'prod-1', variant_group: 'Temperature', variant_name: 'Es (Iced)', extra_price: 0.00, is_available: 1 },
    { id: 'v-2', product_id: 'prod-1', variant_group: 'Temperature', variant_name: 'Panas (Hot)', extra_price: 0.00, is_available: 1 },
    { id: 'v-3', product_id: 'prod-1', variant_group: 'SugarLevel', variant_name: 'Normal Sugar (100%)', extra_price: 0.00, is_available: 1 },
    { id: 'v-4', product_id: 'prod-1', variant_group: 'SugarLevel', variant_name: 'Less Sugar (50%)', extra_price: 0.00, is_available: 1 },
    { id: 'v-5', product_id: 'prod-1', variant_group: 'Topping', variant_name: 'Extra Espresso Shot', extra_price: 6000.00, is_available: 1 },
    { id: 'v-6', product_id: 'prod-2', variant_group: 'Temperature', variant_name: 'Panas (Hot)', extra_price: 0.00, is_available: 1 },
    { id: 'v-7', product_id: 'prod-2', variant_group: 'Temperature', variant_name: 'Es (Iced)', extra_price: 2000.00, is_available: 1 },
    { id: 'v-8', product_id: 'prod-6', variant_group: 'Spicy', variant_name: 'Sedang (Level 1)', extra_price: 0.00, is_available: 1 },
    { id: 'v-9', product_id: 'prod-6', variant_group: 'Spicy', variant_name: 'Pedas (Level 3)', extra_price: 0.00, is_available: 1 }
  ],
  orders: [],
  order_items: [],
  order_item_variants: [],
  payments: []
};

// Check DB Connection
export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isDbConnected = true;
    console.log('✅ Connected to MySQL Database.');
    return true;
  } catch (err) {
    isDbConnected = false;
    console.warn('⚠️ MySQL Database offline/unreachable. Running backend with In-Memory fallback store.');
    return false;
  }
}

// Smart query proxy
const dbProxy = {
  query: async (sql, params = []) => {
    if (isDbConnected) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        console.error('MySQL Query Error:', err.message);
        isDbConnected = false;
      }
    }
    // Fallback Query Execution
    return handleMockQuery(sql, params);
  },
  getConnection: async () => {
    if (isDbConnected) {
      try {
        return await pool.getConnection();
      } catch (err) {
        isDbConnected = false;
      }
    }
    // Return Mock Connection object with transaction support
    return {
      query: async (sql, params = []) => handleMockQuery(sql, params),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
  }
};

function handleMockQuery(sql, params) {
  const cleanSql = sql.trim().toUpperCase();

  // CATEGORIES
  if (cleanSql.includes('FROM CATEGORIES')) {
    return [mockData.categories];
  }

  // TABLES
  if (cleanSql.includes('FROM TABLES')) {
    if (cleanSql.includes('WHERE TABLE_NUMBER =')) {
      const match = mockData.tables.filter(t => t.table_number === params[0]);
      return [match];
    }
    return [mockData.tables];
  }

  // USERS
  if (cleanSql.includes('FROM USERS')) {
    if (cleanSql.includes('WHERE PHONE =')) {
      const match = mockData.users.filter(u => u.phone === params[0]);
      return [match];
    }
    return [mockData.users];
  }
  if (cleanSql.includes('INSERT INTO USERS')) {
    const newUser = { id: params[0], name: params[1], phone: params[2], password_hash: params[3] || '', role: params[4] || 'customer', is_active: 1 };
    mockData.users.push(newUser);
    return [{ insertId: newUser.id }];
  }

  // PRODUCTS
  if (cleanSql.includes('FROM PRODUCTS')) {
    return [mockData.products];
  }
  if (cleanSql.includes('FROM PRODUCT_VARIANTS')) {
    return [mockData.product_variants];
  }
  if (cleanSql.includes('INSERT INTO PRODUCTS')) {
    const newProd = { id: params[0], category_id: params[1], name: params[2], description: params[3], price: params[4], image_url: params[5], is_available: params[6] ? 1 : 0, created_at: new Date() };
    mockData.products.unshift(newProd);
    return [{ insertId: newProd.id }];
  }
  if (cleanSql.includes('UPDATE PRODUCTS SET IS_AVAILABLE = NOT IS_AVAILABLE')) {
    const p = mockData.products.find(item => item.id === params[0]);
    if (p) p.is_available = p.is_available ? 0 : 1;
    return [{ affectedRows: 1 }];
  }
  if (cleanSql.includes('UPDATE PRODUCTS')) {
    const p = mockData.products.find(item => item.id === params[6]);
    if (p) {
      p.category_id = params[0];
      p.name = params[1];
      p.description = params[2];
      p.price = params[3];
      p.image_url = params[4];
      p.is_available = params[5] ? 1 : 0;
    }
    return [{ affectedRows: 1 }];
  }
  if (cleanSql.includes('DELETE FROM PRODUCTS')) {
    mockData.products = mockData.products.filter(item => item.id !== params[0]);
    return [{ affectedRows: 1 }];
  }

  // ORDERS & PAYMENTS
  if (cleanSql.includes('FROM ORDERS')) {
    const formattedOrders = mockData.orders.map(o => {
      const tbl = mockData.tables.find(t => t.id === o.table_id) || { table_number: 'M-01' };
      const pay = mockData.payments.find(p => p.order_id === o.id) || {};
      return {
        ...o,
        table_number: tbl.table_number,
        payment_method: pay.payment_method || 'cash',
        payment_status: pay.payment_status || 'unpaid',
        amount_paid: pay.amount_paid || 0,
        change_amount: pay.change_amount || 0
      };
    });
    return [formattedOrders];
  }
  if (cleanSql.includes('FROM ORDER_ITEMS')) {
    const formattedItems = mockData.order_items.map(oi => {
      const prod = mockData.products.find(p => p.id === oi.product_id) || { name: 'Produk' };
      return { ...oi, product_name: prod.name };
    });
    return [formattedItems];
  }
  if (cleanSql.includes('FROM ORDER_ITEM_VARIANTS')) {
    return [mockData.order_item_variants];
  }
  if (cleanSql.includes('INSERT INTO ORDERS')) {
    const newOrd = { id: params[0], order_number: params[1], table_id: params[2], customer_name: params[3], order_type: params[4], status: params[5], subtotal: params[6], tax_amount: params[7], total_amount: params[8], created_at: new Date() };
    mockData.orders.unshift(newOrd);
    return [{ insertId: newOrd.id }];
  }
  if (cleanSql.includes('INSERT INTO PAYMENTS')) {
    const newPay = { id: params[0], order_id: params[1], payment_method: params[2], payment_status: params[3], amount_paid: params[4], change_amount: params[5], paid_at: params[6] };
    mockData.payments.push(newPay);
    return [{ insertId: newPay.id }];
  }
  if (cleanSql.includes('INSERT INTO ORDER_ITEMS')) {
    const newItem = { id: params[0], order_id: params[1], product_id: params[2], quantity: params[3], unit_price: params[4], subtotal: params[5], item_notes: params[6] };
    mockData.order_items.push(newItem);
    return [{ insertId: newItem.id }];
  }
  if (cleanSql.includes('INSERT INTO ORDER_ITEM_VARIANTS')) {
    const newOiv = { id: params[0], order_item_id: params[1], variant_group: params[2], variant_name: params[3], extra_price: params[4] };
    mockData.order_item_variants.push(newOiv);
    return [{ insertId: newOiv.id }];
  }
  if (cleanSql.includes('UPDATE ORDERS SET STATUS =')) {
    const ord = mockData.orders.find(o => o.id === params[1]);
    if (ord) ord.status = params[0];
    return [{ affectedRows: 1 }];
  }
  if (cleanSql.includes('UPDATE PAYMENTS')) {
    const pay = mockData.payments.find(p => p.order_id === params[2]);
    if (pay) {
      pay.payment_status = 'paid';
      pay.amount_paid = params[0];
      pay.change_amount = params[1];
      pay.paid_at = new Date();
    }
    return [{ affectedRows: 1 }];
  }

  // REPORTS
  if (cleanSql.includes('COUNT(O.ID) AS TOTAL_ORDERS')) {
    const totalRev = mockData.orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    return [[{ total_orders: mockData.orders.length, total_subtotal: totalRev * 0.9, total_tax: totalRev * 0.1, total_revenue: totalRev }]];
  }

  return [[]];
}

testDbConnection();

export default dbProxy;

