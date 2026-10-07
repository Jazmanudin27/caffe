import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import CustomerOrderView from './views/customer/CustomerOrderView';
import CashierPosView from './views/cashier/CashierPosView';
import KitchenDisplayView from './views/kitchen/KitchenDisplayView';
import AdminDashboardView from './views/admin/AdminDashboardView';
import StaffLoginView from './views/auth/StaffLoginView';
import { INITIAL_TABLES } from './data/mockData';
import { storageService } from './services/storageService';
import { apiService } from './services/apiService';

export default function App() {
  // Path Router helper
  const getInitialView = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/kasir')) return 'cashier';
    if (path.startsWith('/dapur')) return 'kitchen';
    if (path.startsWith('/login')) return 'login';
    return 'customer';
  };

  const [activeView, setActiveView] = useState(getInitialView);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [selectedTable, setSelectedTable] = useState(INITIAL_TABLES[2]); // Default Meja M-03

  // Staff Authentication State
  const [staffUser, setStaffUser] = useState(() => {
    try {
      const saved = localStorage.getItem('caffe_staff_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLogoutStaff = () => {
    setStaffUser(null);
    localStorage.removeItem('caffe_staff_user');
  };

  const handleStaffLoginSuccess = (user, role) => {
    setStaffUser(user);
    if (role) {
      setActiveView(role);
      window.history.pushState(null, '', `/${role === 'cashier' ? 'kasir' : role}`);
    }
  };
  
  const DEFAULT_SETTINGS = {
    appName: 'CaffePOS Resto',
    caffeTagline: 'QR Order & Cashier POS System',
    caffeAddress: 'Jl. Malioboro No. 12, Yogyakarta',
    caffePhone: '0812-3456-7890',
    wifiName: 'Caffe_Guest_5G',
    wifiPassword: 'kopienakbanget',
    enableTax: true,
    taxRate: 10,
    enableServiceCharge: false,
    serviceChargeRate: 5,
    receiptFooterNote: 'Terima kasih atas kunjungan Anda! Silakan berkunjung kembali.',
    autoPrintReceipt: false,
    currencySymbol: 'Rp'
  };

  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('caffe_app_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const updateAppSettings = (newSettings) => {
    setAppSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('caffe_app_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Products State
  const [products, setProducts] = useState(() => storageService.getProducts());

  // Orders State
  const [orders, setOrders] = useState(() => storageService.getOrders());

  // Cart State
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Fetch & Auto-sync products, tables, and orders from Express/MySQL API
  useEffect(() => {
    const activeStoreId = staffUser?.storeId || 'caffe-pusat';

    const loadData = async () => {
      try {
        const [fetchedProducts, fetchedOrders, fetchedTables] = await Promise.all([
          apiService.getProducts(activeStoreId),
          apiService.getOrders(activeStoreId),
          apiService.getTables(activeStoreId)
        ]);

        if (fetchedProducts && fetchedProducts.length > 0) {
          setProducts(fetchedProducts);
        }
        if (fetchedOrders && Array.isArray(fetchedOrders)) {
          setOrders(fetchedOrders);
        }
        if (fetchedTables && fetchedTables.length > 0) {
          setTables(fetchedTables);
        }
      } catch (err) {
        console.warn('Menggunakan fallback data lokal', err);
      }
    };

    // Initial load
    loadData();

    // Realtime polling every 3.5 seconds
    const interval = setInterval(() => {
      apiService.getOrders(activeStoreId).then(freshOrders => {
        if (freshOrders && Array.isArray(freshOrders)) {
          setOrders(freshOrders);
        }
      }).catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [staffUser?.storeId]);

  // Sync products to localStorage fallback
  useEffect(() => {
    storageService.saveProducts(products);
  }, [products]);

  // Sync orders to localStorage fallback
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

  // Auto-detect QR Scan URL Parameters (?table=M-01 or ?table=01 or ?store=dago)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      const cleanParam = tableParam.trim().toLowerCase();
      const matchedTable = tables.find(t => {
        const numLower = t.number.toLowerCase();
        return numLower === cleanParam || 
               numLower === `m-${cleanParam}` || 
               numLower.replace('m-', '') === cleanParam;
      });
      if (matchedTable) {
        setSelectedTable(matchedTable);
        const path = window.location.pathname.toLowerCase();
        if (!path.startsWith('/admin') && !path.startsWith('/kasir') && !path.startsWith('/dapur')) {
          setActiveView('customer');
        }
      }
    }
  }, [tables]);

  // Product CRUD Operations
  const addProduct = async (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
    await apiService.createProduct(newProduct);
  };

  const updateProduct = async (id, updatedFields) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    await apiService.updateProduct(id, updatedFields);
  };

  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await apiService.deleteProduct(id);
  };

  const toggleProductAvailability = async (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !p.isAvailable } : p));
    await apiService.toggleProductAvailability(id);
  };

  const toggleProductBestSeller = async (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isBestSeller: !p.isBestSeller } : p));
    await apiService.toggleProductBestSeller(id);
  };

  // Cart operations (Does NOT auto-open cart sidebar)
  const addToCart = (item) => {
    const targetProd = products.find(p => p.id === item.productId);
    if (targetProd && (targetProd.isAvailable === false || targetProd.is_available === 0)) {
      return;
    }

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
  const createOrder = async (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    await apiService.createOrder(newOrder);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    await apiService.updateOrderStatus(orderId, newStatus);
  };

  const updateOrderPayment = async (orderId, paymentDetails) => {
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
    await apiService.payCash(orderId, paymentDetails.amountPaid, paymentDetails.changeAmount);
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const isShowingLogin = activeView === 'login' || (activeView !== 'customer' && !staffUser);
  const showHeaderAndFooter = !isShowingLogin && activeView !== 'admin';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      
      {/* Global Navigation Header (Hidden on Login Page and Admin Portal View) */}
      {showHeaderAndFooter ? (
        <Header
          activeView={activeView}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          tables={tables}
          cartCount={cartItemCount}
          openCart={() => setCartOpen(true)}
          staffUser={staffUser}
          onLogoutStaff={handleLogoutStaff}
          appSettings={appSettings}
        />
      ) : null}

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {activeView === 'customer' && (
          <CustomerOrderView
            products={products}
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
            appSettings={appSettings}
          />
        )}

        {/* Unified Staff Login Portal View */}
        {isShowingLogin && (
          <StaffLoginView
            targetView={activeView === 'login' ? 'cashier' : activeView}
            onLoginSuccess={handleStaffLoginSuccess}
            appSettings={appSettings}
          />
        )}

        {activeView === 'cashier' && staffUser && (
          <CashierPosView
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            updateOrderPayment={updateOrderPayment}
            selectedTable={selectedTable}
            products={products}
            createOrder={createOrder}
            tables={tables}
            appSettings={appSettings}
          />
        )}

        {activeView === 'kitchen' && staffUser && (
          <KitchenDisplayView
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            appSettings={appSettings}
          />
        )}

        {activeView === 'admin' && staffUser && (
          <AdminDashboardView
            products={products}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            toggleProductAvailability={toggleProductAvailability}
            toggleProductBestSeller={toggleProductBestSeller}
            orders={orders}
            tables={tables}
            staffUser={staffUser}
            onLogoutStaff={handleLogoutStaff}
            appSettings={appSettings}
            updateAppSettings={updateAppSettings}
          />
        )}
      </main>
    </div>
  );
}
