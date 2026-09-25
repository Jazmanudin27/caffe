import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CustomerOrderView from './views/customer/CustomerOrderView';
import CashierPosView from './views/cashier/CashierPosView';
import KitchenDisplayView from './views/kitchen/KitchenDisplayView';
import AdminDashboardView from './views/admin/AdminDashboardView';
import { INITIAL_TABLES } from './data/mockData';
import { storageService } from './services/storageService';

export default function App() {
  // Path Router helper
  const getInitialView = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/kasir')) return 'cashier';
    if (path.startsWith('/dapur')) return 'kitchen';
    return 'customer';
  };

  const [activeView, setActiveView] = useState(getInitialView);
  const [tables] = useState(INITIAL_TABLES);
  const [selectedTable, setSelectedTable] = useState(INITIAL_TABLES[2]); // Default Meja M-03
  
  // Products State
  const [products, setProducts] = useState(() => storageService.getProducts());

  // Orders State
  const [orders, setOrders] = useState(() => storageService.getOrders());

  // Cart State
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Sync products to localStorage
  useEffect(() => {
    storageService.saveProducts(products);
  }, [products]);

  // Sync orders to localStorage
  useEffect(() => {
    storageService.saveOrders(orders);
  }, [orders]);

  // Sync route on popstate (Browser Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Product CRUD Operations
  const addProduct = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id, updatedFields) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleProductAvailability = (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !p.isAvailable } : p));
  };

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          JSON.stringify(i.selectedVariants) === JSON.stringify(item.selectedVariants) &&
          i.notes === item.notes
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
    setCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const clearCart = () => setCart([]);

  // Order Handlers
  const createOrder = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const updateOrderPayment = (orderId, paymentDetails) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: paymentDetails.paymentStatus,
              amountPaid: paymentDetails.amountPaid,
              changeAmount: paymentDetails.changeAmount,
              status: paymentDetails.status || o.status,
            }
          : o
      )
    );
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#090807] text-gray-100 flex flex-col font-sans selection:bg-amber-500 selection:text-gray-950">
      
      {/* Global Navigation Header */}
      <Header
        activeView={activeView}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        tables={tables}
        cartCount={cartItemCount}
        openCart={() => setCartOpen(true)}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {activeView === 'customer' && (
          <CustomerOrderView
            selectedTable={selectedTable}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            clearCart={clearCart}
            orders={orders}
            createOrder={createOrder}
            cartOpen={cartOpen}
            setCartOpen={setCartOpen}
          />
        )}

        {activeView === 'cashier' && (
          <CashierPosView
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            updateOrderPayment={updateOrderPayment}
            selectedTable={selectedTable}
          />
        )}

        {activeView === 'kitchen' && (
          <KitchenDisplayView
            orders={orders}
            updateOrderStatus={updateOrderStatus}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboardView
            products={products}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            toggleProductAvailability={toggleProductAvailability}
            orders={orders}
            tables={tables}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}
