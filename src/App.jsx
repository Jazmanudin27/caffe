import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CustomerOrderView from './components/CustomerOrderView';
import CashierPosView from './components/CashierPosView';
import KitchenDisplayView from './components/KitchenDisplayView';
import DatabaseSchemaView from './components/DatabaseSchemaView';
import { INITIAL_TABLES, INITIAL_ORDERS } from './data/mockData';

export default function App() {
  const [activeView, setActiveView] = useState('customer'); // 'customer' | 'cashier' | 'kitchen' | 'database'
  const [tables] = useState(INITIAL_TABLES);
  const [selectedTable, setSelectedTable] = useState(INITIAL_TABLES[2]); // Default Meja M-03
  
  // Orders State (Persisted in localStorage if available)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('caffe_pos_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Cart State
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Sync orders to localStorage
  useEffect(() => {
    localStorage.setItem('caffe_pos_orders', JSON.stringify(orders));
  }, [orders]);

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      // Check if item with exact same product and variants already exists
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
    <div className="min-h-screen bg-[#0F0D0C] text-gray-100 flex flex-col font-sans selection:bg-amber-500 selection:text-gray-950">
      
      {/* Global Navigation Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
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

        {activeView === 'database' && (
          <DatabaseSchemaView />
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-gray-900 bg-gray-950 py-4 px-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 CaffePOS System. Full-stack QR Order & Cashier App.</span>
          <div className="flex items-center gap-3 text-amber-500 font-mono text-[11px]">
            <span>PostgreSQL Ready</span> • <span>QRIS Midtrans Ready</span> • <span>React JS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
