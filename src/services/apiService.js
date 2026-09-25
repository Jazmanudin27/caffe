import { storageService } from './storageService';

const API_BASE_URL = '/api';

export const apiService = {
  // Fetch Products from MySQL API
  getProducts: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
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
  getOrders: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
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
