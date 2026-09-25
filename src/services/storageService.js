import { INITIAL_ORDERS, PRODUCTS } from '../data/mockData';

const ORDERS_KEY = 'caffe_pos_orders';
const PRODUCTS_KEY = 'caffe_pos_products';

export const storageService = {
  getOrders: () => {
    try {
      const saved = localStorage.getItem(ORDERS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch (e) {
      console.error('Error loading orders from localStorage', e);
      return INITIAL_ORDERS;
    }
  },

  saveOrders: (orders) => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to localStorage', e);
    }
  },

  getProducts: () => {
    try {
      const saved = localStorage.getItem(PRODUCTS_KEY);
      return saved ? JSON.parse(saved) : PRODUCTS;
    } catch (e) {
      console.error('Error loading products from localStorage', e);
      return PRODUCTS;
    }
  },

  saveProducts: (products) => {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products to localStorage', e);
    }
  }
};
