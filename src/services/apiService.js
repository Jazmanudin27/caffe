import { storageService } from './storageService';

const API_BASE_URL = '/api';

export const apiService = {
  // Check if Phone exists or login
  checkPhone: async (phone) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return await res.json();
    } catch (e) {
      console.warn('API Offline, using local session fallback', e);
      return { registered: false, phone };
    }
  },

  // Staff login against MySQL users table database
  staffLogin: async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal login ke database');
      }
      return await res.json();
    } catch (e) {
      console.warn('Backend DB auth unreachable, using local role inference fallback.', e);
      // Fallback local detection if API is offline
      const cleanUser = username.trim().toLowerCase();
      let role = 'cashier';
      let displayName = username.trim();
      if (cleanUser.includes('admin')) { role = 'admin'; displayName = 'Administrator'; }
      else if (cleanUser.includes('dapur') || cleanUser.includes('kitchen')) { role = 'kitchen'; displayName = 'Barista & Dapur'; }
      else if (cleanUser.includes('kasir') || cleanUser.includes('cashier')) { role = 'cashier'; displayName = 'Kasir POS'; }
      return {
        success: true,
        user: { id: 'usr-' + Date.now(), name: displayName, username: username.trim(), role, loggedInAt: new Date().toISOString() }
      };
    }
  },

  // Register new customer
  registerCustomer: async (name, phone) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });
      return await res.json();
    } catch (e) {
      console.warn('API Offline, using local session fallback', e);
      return { success: true, user: { id: 'usr-' + Date.now(), name, phone, role: 'customer' } };
    }
  },

  // Fetch Categories from API
  getCategories: async (storeId = 'caffe-pusat') => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories?store_id=${storeId}`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch (e) {
      console.warn('API Offline, using default categories', e);
      return null;
    }
  },

  createCategory: async (cat) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline for createCategory', e);
    }
  },

  updateCategory: async (id, cat) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline for updateCategory', e);
    }
  },

  deleteCategory: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline for deleteCategory', e);
    }
  },

  // Fetch Tables from API
  getTables: async (storeId = 'caffe-pusat') => {
    try {
      const res = await fetch(`${API_BASE_URL}/tables?store_id=${storeId}`);
      if (!res.ok) throw new Error('Failed to fetch tables');
      return await res.json();
    } catch (e) {
      console.warn('API Offline, using default tables', e);
      return null;
    }
  },

  createTable: async (tbl) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tbl)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline for createTable', e);
    }
  },

  updateTable: async (id, tbl) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tbl)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline for updateTable', e);
    }
  },

  deleteTable: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tables/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline for deleteTable', e);
    }
  },

  // Fetch Products from MySQL API
  getProducts: async (storeId = 'caffe-pusat') => {
    try {
      const res = await fetch(`${API_BASE_URL}/products?store_id=${storeId}`);
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('Backend API unreachable, using LocalStorage fallback.', e);
      return storageService.getProducts();
    }
  },

  // Save/Create Product in MySQL API
  createProduct: async (product) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline, saved to LocalStorage.', e);
    }
  },

  // Update Product
  updateProduct: async (id, updatedFields) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline, updated LocalStorage.', e);
    }
  },

  // Toggle Availability
  toggleProductAvailability: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}/toggle-availability`, {
        method: 'PATCH'
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline', e);
    }
  },

  // Toggle Best Seller
  toggleProductBestSeller: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}/toggle-bestseller`, {
        method: 'PATCH'
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline', e);
    }
  },

  // Delete Product
  deleteProduct: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline', e);
    }
  },

  // Fetch Orders
  getOrders: async (storeId = 'caffe-pusat') => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders?store_id=${storeId}`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch (e) {
      return storageService.getOrders();
    }
  },

  // Create Order
  createOrder: async (order) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline', e);
    }
  },

  // Update Order Status
  updateOrderStatus: async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline', e);
    }
  },

  // Process Cash Payment
  payCash: async (id, amountPaid, changeAmount) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/pay-cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid, changeAmount })
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline', e);
    }
  }
};
