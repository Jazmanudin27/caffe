import React, { useState, useEffect } from 'react';
import { 
  Coffee, CupSoda, Milk, Utensils, Cookie, Plus, ShoppingBag, 
  QrCode, AlertCircle, Clock, ChevronRight, X, Sparkles, DollarSign,
  Flame, ShieldCheck, CheckCircle2, User, Phone, UserCheck, UserPlus, LogOut, Home
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { formatRupiah } from '../../utils/formatters';
import { apiService } from '../../services/apiService';

export default function CustomerOrderView({ 
  products = [],
  selectedTable, 
  cart, 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  orders,
  createOrder,
  cartOpen,
  setCartOpen
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile Bottom Navbar & Profile Modal State
  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [profileModal, setProfileModal] = useState(false);
  
  // Logged-in Customer User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('caffe_current_customer');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Auth Modal States
  const [authModal, setAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('phone'); // 'phone' or 'register'
  const [inputPhone, setInputPhone] = useState('');
  const [inputName, setInputName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Customization modal state
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [itemNotes, setItemNotes] = useState('');
  const [itemQty, setItemQty] = useState(1);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  // Checkout modal state
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [customerName, setCustomerName] = useState(currentUser ? currentUser.name : '');
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [isProcessing, setIsProcessing] = useState(false);

  // Update customer name when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
    }
  }, [currentUser]);

  // Auth Handlers: Check Phone (Login or Step to Register)
  const handleCheckPhone = async (e) => {
    if (e) e.preventDefault();
    if (!inputPhone.trim()) {
      setAuthError('Silakan masukkan Nomor HP Anda');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await apiService.checkPhone(inputPhone.trim());
      if (res.registered && res.user) {
        // User registered: Login immediately
        setCurrentUser(res.user);
        localStorage.setItem('caffe_current_customer', JSON.stringify(res.user));
        setAuthModal(false);
        setToastMessage(`Selamat datang kembali, ${res.user.name}!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        // User not registered: Proceed to name registration step
        setAuthStep('register');
      }
    } catch (err) {
      setAuthError('Terjadi kesalahan saat memeriksa Nomor HP');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth Handlers: Register Customer (Name + Phone)
  const handleRegisterCustomer = async (e) => {
    if (e) e.preventDefault();
    if (!inputName.trim()) {
      setAuthError('Silakan masukkan Nama Lengkap Anda');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await apiService.registerCustomer(inputName.trim(), inputPhone.trim());
      if (res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('caffe_current_customer', JSON.stringify(res.user));
        setAuthModal(false);
        setToastMessage(`Akun berhasil dibuat! Selamat datang, ${res.user.name}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      setAuthError('Gagal membuat akun pelanggan');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout / Change Account
  const handleLogoutCustomer = () => {
    setCurrentUser(null);
    localStorage.removeItem('caffe_current_customer');
    setInputPhone('');
    setInputName('');
    setAuthStep('phone');
    setToastMessage('Anda telah keluar dari akun pelanggan');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Category Icon Resolver
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Coffee': return <Coffee className="w-4 h-4" />;
      case 'CupSoda': return <CupSoda className="w-4 h-4" />;
      case 'Milk': return <Milk className="w-4 h-4" />;
      case 'Utensils': return <Utensils className="w-4 h-4" />;
      case 'Cookie': return <Cookie className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  // Filter products dynamically from MySQL database
  const filteredProducts = (products || []).filter((product) => {
    const matchesCat = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Open product customization modal (Enforces Login First)
  const openCustomization = (product) => {
    if (!currentUser) {
      setAuthStep('phone');
      setAuthError('');
      setAuthModal(true);
      return;
    }

    setActiveProduct(product);
    setItemQty(1);
    setItemNotes('');
    
    const initialVariants = {};
    if (product.variants) {
      product.variants.forEach(vGroup => {
        const isOptionalGroup = vGroup.group.toLowerCase().includes('topping') || vGroup.required === false;
        if (!isOptionalGroup && vGroup.options && vGroup.options.length > 0) {
          initialVariants[vGroup.group] = vGroup.options[0];
        }
      });
    }
    setSelectedVariants(initialVariants);
  };

  // Calculate customized unit price
  const calculateCustomizedPrice = () => {
    if (!activeProduct) return 0;
    let total = activeProduct.price;
    Object.values(selectedVariants).forEach(v => {
      if (v && v.extraPrice) total += v.extraPrice;
    });
    return total;
  };

  // Add customized item to cart (Without auto-opening cart)
  const handleAddToCart = () => {
    if (!activeProduct) return;
    const variantLabels = Object.values(selectedVariants).filter(Boolean).map(v => v.label);
    const customizedPrice = calculateCustomizedPrice();
    
    addToCart({
      productId: activeProduct.id,
      productName: activeProduct.name,
      unitPrice: customizedPrice,
      quantity: itemQty,
      selectedVariants: variantLabels,
      notes: itemNotes,
      imageUrl: activeProduct.imageUrl
    });

    const productName = activeProduct.name;
    setActiveProduct(null);

    // Show smooth Toast Notification
    setToastMessage(`"${productName}" (${itemQty}x) ditambahkan ke keranjang`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Cart Totals
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const cartTax = Math.round(cartSubtotal * 0.1);
  const cartTotal = cartSubtotal + cartTax;

  // Submit Order
  const handleFinalCheckout = (payNow = false) => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const newOrder = {
        id: 'ord-' + Date.now(),
        orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        tableNumber: selectedTable.number,
        tableToken: selectedTable.token,
        customerName: customerName.trim() || 'Pelanggan Meja ' + selectedTable.number,
        orderType: 'dine_in',
        status: payNow ? 'preparing' : 'pending_payment',
        paymentStatus: payNow ? 'paid' : 'unpaid',
        paymentMethod: paymentMethod,
        createdAt: new Date().toISOString(),
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        items: cart.map(item => ({
          ...item,
          subtotal: item.unitPrice * item.quantity
        }))
      };

      createOrder(newOrder);
      clearCart();
      setIsProcessing(false);
      setCheckoutModal(false);
      setCartOpen(false);
    }, 800);
  };

  // Active orders for current table
  const activeTableOrders = orders.filter(o => o.tableNumber === selectedTable.number);

  // Customer Orders (Filtered for logged-in user or active table)
  const customerOrders = orders.filter(o => {
    if (currentUser && currentUser.phone) {
      return o.customerPhone === currentUser.phone || o.customerName === currentUser.name || o.tableNumber === selectedTable.number;
    }
    return o.tableNumber === selectedTable.number;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in pb-28 relative text-gray-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 glass-panel bg-emerald-900/90 text-emerald-100 px-5 py-3 rounded-2xl border border-emerald-500/40 shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-bold w-[90%] max-w-sm justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* VIEW TAB 1: BERANDA / KATALOG MENU */}
      {activeMobileTab === 'home' && (
        <div className="space-y-6 md:space-y-8 animate-fade-in">

          {/* CATEGORIES SLIDER & SEARCH BAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto w-full md:w-auto pb-1.5 md:pb-0 no-scrollbar">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-300 tracking-tight font-heading ${
                      isSelected
                        ? 'gradient-gold text-white shadow-lg shadow-amber-600/30 border border-amber-400 scale-[1.04]'
                        : 'bg-white text-gray-800 border border-amber-500/25 hover:bg-amber-50 hover:text-amber-900 shadow-sm hover:border-amber-500/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl transition-all ${isSelected ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'}`}>
                      {getCategoryIcon(cat.icon)}
                    </div>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Cari kopi, makanan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-amber-500/30 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 shadow-sm"
              />
            </div>
          </div>

          {/* PRODUCT GRID - 2 COLUMNS ON MOBILE */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {filteredProducts.map(product => {
              const inCartQty = cart
                .filter(i => i.productId === product.id)
                .reduce((total, i) => total + i.quantity, 0);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between group relative border border-amber-500/20 hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div>
                    {/* Product Image Header */}
                    <div className="relative h-36 sm:h-52 overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                      
                      {/* Price Badge */}
                      <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 bg-white/95 text-gray-900 px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl text-[10px] sm:text-xs font-black font-mono shadow-md border border-amber-500/20">
                        {formatRupiah(product.price)}
                      </div>

                      {/* Quantity In Cart Badge */}
                      {inCartQty > 0 && (
                        <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 gradient-gold text-white font-black px-2.5 py-1 rounded-xl text-[10px] sm:text-xs shadow-md flex items-center gap-1 animate-pulse border border-amber-300">
                          <span>{inCartQty}x</span> di Keranjang
                        </div>
                      )}

                      {/* Tag Badge */}
                      {inCartQty === 0 && (
                        <div className="flex absolute top-2 right-2 sm:top-3.5 sm:right-3.5 gradient-gold text-white px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md items-center gap-1 border border-amber-300/40">
                          <Flame className="w-3 h-3 text-white fill-white" /> Best Seller
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="p-3 sm:p-5 space-y-1 sm:space-y-2">
                      <h3 className="font-extrabold text-gray-900 text-xs sm:text-base group-hover:text-amber-700 transition-colors line-clamp-1 sm:line-clamp-none">
                        {product.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="p-3 sm:p-5 pt-0">
                    <button
                      onClick={() => openCustomization(product)}
                      className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm gradient-gold text-white shadow-md hover:shadow-lg transition transform active:scale-95 border border-amber-500/40"
                    >
                      <Plus className="w-4 h-4 text-white stroke-[3]" />
                      <span>{inCartQty > 0 ? `Tambah (${inCartQty}x)` : 'Tambah'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEW TAB 2: HISTORI PESANAN PELANGGAN (ORDER HISTORY & TRACKER) */}
      {activeMobileTab === 'orders' && (
        <div className="space-y-6 animate-fade-in">
          <div className="pb-3 border-b border-amber-500/20">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-600" /> Pesanan
            </h2>
          </div>

          {customerOrders.length === 0 ? (
            <div className="glass-panel rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto border border-amber-500/20">
              <Clock className="w-16 h-16 text-amber-400 opacity-40 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-gray-900 text-lg">Belum Ada Pesanan Aktif</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Anda belum melakukan pemesanan di Meja {selectedTable.number}. Silakan pilih menu di katalog Beranda!
                </p>
              </div>
              <button
                onClick={() => setActiveMobileTab('home')}
                className="gradient-gold text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-lg inline-flex items-center gap-2"
              >
                <span>Lihat Katalog Menu</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerOrders.map(order => (
                <div key={order.id} className="glass-card rounded-2xl p-5 border border-amber-500/20 space-y-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-amber-700 font-extrabold">{order.orderNumber}</span>
                      <h4 className="font-bold text-gray-900 text-base">{order.customerName}</h4>
                      <p className="text-[11px] text-gray-400">Meja {order.tableNumber} • {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    
                    {order.status === 'pending_payment' && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                        Menunggu Bayar Kasir
                      </span>
                    )}
                    {order.status === 'preparing' && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
                        Sedang Dibuat Barista
                      </span>
                    )}
                    {order.status === 'ready' && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
                        Siap Disajikan
                      </span>
                    )}
                    {order.status === 'completed' && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Selesai
                      </span>
                    )}
                  </div>

                  {/* Realtime Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-gray-600">
                      <span>Proses Pesanan:</span>
                      <span className="text-amber-700">
                        {order.status === 'pending_payment' ? '25% (Menunggu Pembayaran)' :
                         order.status === 'preparing' ? '50% (Sedang Dibuat)' :
                         order.status === 'ready' ? '75% (Siap Disajikan)' : '100% (Selesai)'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-amber-500/20">
                      <div className={`h-full rounded-full transition-all duration-700 ${
                        order.status === 'pending_payment' ? 'w-1/4 gradient-gold' :
                        order.status === 'preparing' ? 'w-2/4 bg-blue-500' :
                        order.status === 'ready' ? 'w-3/4 bg-purple-500' : 'w-full bg-emerald-500'
                      }`} />
                    </div>
                  </div>

                  {/* Order Items Breakdown */}
                  <div className="bg-amber-50/60 p-3 rounded-2xl space-y-2 border border-amber-500/10">
                    <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Item Yang Dipesan:</p>
                    <div className="space-y-1.5 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-gray-700">
                          <div>
                            <span className="font-bold text-gray-900">{item.quantity}x {item.productName}</span>
                            {item.selectedVariants && item.selectedVariants.length > 0 && (
                              <p className="text-[10px] text-amber-700 font-medium">{item.selectedVariants.join(' • ')}</p>
                            )}
                            {item.notes && <p className="text-[10px] text-gray-500 italic">"{item.notes}"</p>}
                          </div>
                          <span className="font-mono text-gray-900 font-semibold">{formatRupiah(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-600 border-t border-gray-100 pt-3">
                    <span>Metode: <strong className="uppercase font-mono text-gray-900">{order.paymentMethod}</strong></span>
                    <span className="text-gray-900 font-bold">Total: <strong className="text-amber-700 font-mono text-sm">{formatRupiah(order.total)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 3: HALAMAN AKUN PELANGGAN (DEDICATED VIEW PAGE) */}
      {activeMobileTab === 'account' && (
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
          {currentUser ? (
            <div className="glass-panel rounded-3xl p-6 border border-amber-500/20 space-y-6 bg-white shadow-md">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                <div className="w-16 h-16 rounded-3xl gradient-gold flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900">{currentUser.name}</h3>
                  <p className="text-xs text-amber-700 font-mono font-bold flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5" /> {currentUser.phone}
                  </p>
                  <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Pelanggan Terverifikasi
                  </span>
                </div>
              </div>

              {/* Account Info Details */}
              <div className="space-y-3 text-xs">
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-500/15 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Sesi Meja Anda:</span>
                  <span className="font-extrabold text-amber-900 bg-amber-200/60 px-3 py-1 rounded-xl border border-amber-400/30">
                    Meja {selectedTable.number}
                  </span>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-500/15 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Pesanan Aktif:</span>
                  <span className="font-mono font-extrabold text-amber-800 text-sm">
                    {customerOrders.length} Pesanan
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  onClick={() => setActiveMobileTab('orders')}
                  className="w-full gradient-gold text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Lihat Histori & Status Pesanan</span>
                </button>

                <button
                  onClick={handleLogoutCustomer}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-extrabold py-3.5 rounded-2xl text-xs border border-red-200 flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar / Ganti Akun Pelanggan</span>
                </button>
              </div>
            </div>
          ) : (
            /* IF NOT LOGGED IN: DISPLAY LOGIN / REGISTER FORM ON PAGE */
            <div className="glass-panel rounded-3xl p-6 border border-amber-500/20 bg-white shadow-md space-y-5">
              {authStep === 'phone' ? (
                <form onSubmit={handleCheckPhone} className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-2xl gradient-badge flex items-center justify-center text-amber-700 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900">Masuk Akun Pemesan</h3>
                      <p className="text-[11px] text-gray-500">Masukkan Nomor HP Anda untuk mulai memesan</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-gray-700 block text-xs uppercase tracking-wider">
                      Nomor HP / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 08123456789"
                        value={inputPhone}
                        onChange={e => setInputPhone(e.target.value)}
                        className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs text-gray-900 font-mono tracking-wide"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 italic">
                      *Jika Nomor HP belum terdaftar, Anda akan langsung diarahkan ke pendaftaran akun baru.
                    </p>
                  </div>

                  {authError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full gradient-gold text-white font-black py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <span>Memeriksa Nomor HP...</span>
                    ) : (
                      <>
                        <span>Lanjutkan Masuk</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterCustomer} className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-2xl gradient-badge flex items-center justify-center text-amber-700 shrink-0">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900">Registrasi Pelanggan Baru</h3>
                      <p className="text-[11px] text-amber-700">Nomor HP belum terdaftar di sistem</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-gray-700 block text-xs uppercase tracking-wider mb-1">
                        Nomor HP
                      </label>
                      <input
                        type="text"
                        disabled
                        value={inputPhone}
                        className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-amber-800 font-mono bg-amber-50/50 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block text-xs uppercase tracking-wider mb-1">
                        Nama Lengkap Anda
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Budi Santoso"
                          value={inputName}
                          onChange={e => setInputName(e.target.value)}
                          className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {authError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('phone');
                        setAuthError('');
                      }}
                      className="w-1/3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-3.5 rounded-2xl text-xs border border-gray-200"
                    >
                      Ubah No HP
                    </button>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="flex-1 gradient-gold text-white font-black py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <span>Mendaftarkan...</span>
                      ) : (
                        <span>Daftar & Lanjut Pesan</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* PRODUCT CUSTOMIZATION MODAL (LIGHT THEME ELEGANT) */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-gray-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-4 max-h-[90vh] flex flex-col border border-amber-500/20">
            
            {/* Modal Image Header */}
            <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
              <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-900/30 to-transparent" />
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full text-gray-800 shadow-md transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-5 right-5 space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow">{activeProduct.name}</h3>
                <p className="text-xs text-amber-300 font-extrabold font-mono drop-shadow">
                  Harga dasar: {formatRupiah(activeProduct.price)}
                </p>
              </div>
            </div>

            {/* Options List */}
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-xs">
              {activeProduct.variants && activeProduct.variants.length > 0 ? (
                activeProduct.variants.map((vGroup, idx) => {
                  const isOptionalGroup = vGroup.group.toLowerCase().includes('topping') || vGroup.required === false;
                  
                  return (
                    <div key={idx} className="space-y-2">
                      <label className="font-extrabold text-gray-900 block text-xs tracking-wide uppercase flex items-center justify-between">
                        <span>{vGroup.name}</span>
                        <span className={`text-[10px] font-semibold ${isOptionalGroup ? 'text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300' : 'text-amber-700 font-normal'}`}>
                          {isOptionalGroup ? 'Opsional (Bisa dilewati)' : 'Pilih salah satu'}
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {vGroup.options.map((opt, optIdx) => {
                          const isSelected = selectedVariants[vGroup.group]?.label === opt.label;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => {
                                if (isSelected && isOptionalGroup) {
                                  const updated = { ...selectedVariants };
                                  delete updated[vGroup.group];
                                  setSelectedVariants(updated);
                                } else {
                                  setSelectedVariants({ ...selectedVariants, [vGroup.group]: opt });
                                }
                              }}
                              className={`p-2.5 sm:p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${
                                isSelected
                                  ? 'gradient-gold text-white font-extrabold shadow-md border-amber-600 scale-[1.02]'
                                  : 'bg-amber-50/40 border-amber-500/20 text-gray-800 hover:bg-amber-100/60'
                              }`}
                            >
                              <span className="font-bold">{opt.label}</span>
                              {opt.extraPrice > 0 && (
                                <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-100 font-bold' : 'text-amber-800 font-bold'}`}>
                                  +{formatRupiah(opt.extraPrice)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 italic">Menu ini siap disajikan tanpa opsi varian tambahan.</p>
              )}

              {/* Notes */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <label className="font-extrabold text-gray-900 block text-xs uppercase tracking-wide">
                  Catatan Khusus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kurangi es, tanpa sedotan..."
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  className="w-full glass-input rounded-2xl p-3 text-xs text-gray-900 bg-amber-50/40 border border-amber-500/20"
                />
              </div>
            </div>

            {/* Modal Footer with Clear Quantity Selector */}
            <div className="p-4 sm:p-5 bg-amber-50/70 border-t border-amber-500/20 flex flex-col gap-3 shrink-0">
              
              {/* Quantity Selector Header */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-amber-500/20 shadow-sm">
                <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Jumlah Pesanan (Qty):</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                    className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-900 flex items-center justify-center font-black text-sm transition-all border border-amber-300"
                  >
                    -
                  </button>
                  <span className="font-black text-sm w-6 text-center text-amber-900 font-mono text-base">{itemQty}</span>
                  <button
                    onClick={() => setItemQty(itemQty + 1)}
                    className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-900 flex items-center justify-center font-black text-sm transition-all border border-amber-300"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Submit Button */}
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-between gradient-gold text-white font-black py-3.5 px-5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-600/25 transition transform active:scale-95"
              >
                <span>Tambah {itemQty}x ke Keranjang</span>
                <span className="font-mono text-sm">{formatRupiah(calculateCustomizedPrice() * itemQty)}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CART DRAWER MODAL (CLEAN LIGHT THEME) */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-l border-amber-500/20 w-full max-w-md h-full flex flex-col justify-between p-5 sm:p-6 space-y-4 shadow-2xl text-gray-900">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-gray-900 font-extrabold text-base">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <span>Keranjang Pesanan (Meja {selectedTable.number})</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-amber-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <ShoppingBag className="w-16 h-16 opacity-30 text-amber-500" />
                  <p className="text-xs font-semibold text-gray-500">Keranjang Anda masih kosong</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-500/20 space-y-2 text-xs shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{item.productName}</h4>
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <p className="text-[11px] text-amber-800 font-medium">{item.selectedVariants.join(' • ')}</p>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-gray-500 italic">"{item.notes}"</p>
                        )}
                      </div>
                      <span className="font-black font-mono text-amber-900 text-sm">
                        {formatRupiah(item.unitPrice * item.quantity)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-amber-500/10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-amber-300 text-amber-900 flex items-center justify-center font-bold shadow-sm hover:bg-amber-500 hover:text-white"
                        >
                          -
                        </button>
                        <span className="font-black text-gray-900 text-xs px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-amber-300 text-amber-900 flex items-center justify-center font-bold shadow-sm hover:bg-amber-500 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-gray-100 space-y-4 text-xs">
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-500/20 space-y-2 text-gray-700 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-gray-900 font-semibold">{formatRupiah(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak Restoran (PB1 10%)</span>
                    <span className="font-mono text-gray-900 font-semibold">{formatRupiah(cartTax)}</span>
                  </div>
                  <div className="flex justify-between font-black text-base text-gray-900 pt-2 border-t border-amber-500/20">
                    <span>Total Pembayaran</span>
                    <span className="text-amber-800 font-black font-mono text-xl">{formatRupiah(cartTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutModal(true)}
                  className="w-full gradient-gold text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-600/25 text-sm transition transform active:scale-95"
                >
                  <span>Lanjut ke Pembayaran</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT & PAYMENT METHOD MODAL (CLEAN LIGHT THEME) */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-amber-500/30 text-gray-900 w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl">
            
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" /> Konfirmasi Pembayaran
              </h3>
              <button onClick={() => setCheckoutModal(false)} className="text-gray-400 hover:text-gray-900 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-gray-800 block mb-1.5 uppercase text-[10px] tracking-wider">Nama Pemesan</label>
                <input
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full glass-input rounded-2xl p-3 text-xs text-gray-900 bg-amber-50/40 border border-amber-500/20"
                />
              </div>

              <div>
                <label className="font-extrabold text-gray-800 block mb-1.5 uppercase text-[10px] tracking-wider">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'qris'
                        ? 'gradient-gold text-white font-extrabold shadow-md border-amber-600'
                        : 'bg-amber-50/40 border-amber-500/20 text-gray-700 hover:bg-amber-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs ${paymentMethod === 'qris' ? 'text-white' : 'text-gray-900'}`}>QRIS / E-Wallet</span>
                      <QrCode className={`w-4 h-4 ${paymentMethod === 'qris' ? 'text-white' : 'text-amber-600'}`} />
                    </div>
                    <span className={`text-[10px] ${paymentMethod === 'qris' ? 'text-amber-100' : 'text-gray-500'}`}>Bayar via GoPay, OVO, BCA</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'cash'
                        ? 'gradient-gold text-white font-extrabold shadow-md border-amber-600'
                        : 'bg-amber-50/40 border-amber-500/20 text-gray-700 hover:bg-amber-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs ${paymentMethod === 'cash' ? 'text-white' : 'text-gray-900'}`}>Tunai di Kasir</span>
                      <DollarSign className={`w-4 h-4 ${paymentMethod === 'cash' ? 'text-white' : 'text-emerald-600'}`} />
                    </div>
                    <span className={`text-[10px] ${paymentMethod === 'cash' ? 'text-amber-100' : 'text-gray-500'}`}>Bayar cash saat kasir memproses</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'qris' ? (
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-500/20 text-center space-y-2">
                  <p className="text-[11px] text-gray-600 font-semibold">Scan Kode QRIS di bawah ini:</p>
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-md border border-amber-300">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 bg-gray-950 rounded-xl flex items-center justify-center p-2">
                      <QrCode className="w-full h-full text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-amber-900 font-black font-mono">Total: {formatRupiah(cartTotal)}</p>
                </div>
              ) : (
                <div className="bg-amber-100/80 p-3.5 rounded-2xl border border-amber-300 text-amber-950 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-700" /> Instruksi Pembayaran Tunai:
                  </div>
                  <p className="text-amber-900 text-[11px] leading-relaxed">
                    Pesanan Anda akan dikirim ke Kasir dengan status <strong>Menunggu Bayar</strong>. Silakan menuju kasir untuk melakukan pembayaran.
                  </p>
                </div>
              )}
            </div>

            <button
              disabled={isProcessing}
              onClick={() => handleFinalCheckout(paymentMethod === 'qris')}
              className="w-full gradient-gold text-white font-black py-3.5 sm:py-4 rounded-2xl text-xs shadow-xl shadow-amber-600/25 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span>Memproses Pesanan...</span>
              ) : paymentMethod === 'qris' ? (
                <span>Simulasikan Bayar QRIS (Lunas)</span>
              ) : (
                <span>Kirim Pesanan ke Kasir</span>
              )}
            </button>

          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar (Positioned above bottom navbar on mobile) */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-20 md:bottom-5 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full gradient-gold text-gray-950 p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-amber-300/40 hover:scale-[1.02] transition transform active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-950/80 text-amber-400 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm border border-amber-500/30">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <div className="text-left">
                <p className="font-black text-xs text-gray-950">Lihat Pesanan Meja {selectedTable.number}</p>
                <p className="text-[10px] sm:text-[11px] text-gray-900 font-semibold">{cart.length} Jenis Menu dipilih</p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-black text-sm sm:text-base font-mono">
              <span>{formatRupiah(cartTotal)}</span>
              <ChevronRight className="w-5 h-5 text-gray-950" />
            </div>
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (BRIGHT LIGHT THEME) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-amber-500/20 py-2 px-6 flex justify-around items-center md:hidden shadow-[0_-8px_25px_rgba(180,83,9,0.1)]">
        
        {/* 1. BERANDA (Home/Catalog) */}
        <button
          onClick={() => {
            setActiveMobileTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeMobileTab === 'home'
              ? 'text-amber-700 font-black scale-105'
              : 'text-gray-400 hover:text-gray-700 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeMobileTab === 'home' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-700 shadow-sm' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Beranda</span>
        </button>

        {/* 2. PESANAN (Histori Pesanan Pelanggan) */}
        <button
          onClick={() => {
            setActiveMobileTab('orders');
          }}
          className={`flex flex-col items-center gap-1 relative transition-all ${
            activeMobileTab === 'orders'
              ? 'text-amber-700 font-black scale-105'
              : 'text-gray-400 hover:text-gray-700 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl relative transition-all ${activeMobileTab === 'orders' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-700 shadow-sm' : ''}`}>
            <Clock className="w-5 h-5" />
            {customerOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {customerOrders.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Pesanan</span>
        </button>

        {/* 3. AKUN (Halaman Akun Pelanggan) */}
        <button
          onClick={() => {
            setActiveMobileTab('account');
          }}
          className={`flex flex-col items-center gap-1 relative transition-all ${
            activeMobileTab === 'account'
              ? 'text-amber-700 font-black scale-105'
              : 'text-gray-400 hover:text-gray-700 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl relative transition-all ${activeMobileTab === 'account' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-700 shadow-sm' : ''}`}>
            <User className="w-5 h-5" />
            {currentUser && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">{currentUser ? 'Akun Saya' : 'Akun'}</span>
        </button>

      </nav>

      {/* CUSTOMER PROFILE MODAL */}
      {profileModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-amber-500/30 text-gray-100 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl gradient-gold flex items-center justify-center text-gray-950 font-black text-xl shadow-lg">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">{currentUser.name}</h3>
                <p className="text-xs text-amber-400 font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {currentUser.phone}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-950/80 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="text-gray-400">Sesi Meja Saat Ini:</span>
                <span className="font-bold text-white bg-amber-500/20 text-amber-300 px-3 py-1 rounded-xl border border-amber-500/30">
                  Meja {selectedTable.number}
                </span>
              </div>

              <div className="bg-gray-950/80 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="text-gray-400">Item di Keranjang:</span>
                <span className="font-mono font-bold text-amber-400">
                  {cart.reduce((a, b) => a + b.quantity, 0)} Porsi
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  setProfileModal(false);
                  handleLogoutCustomer();
                }}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-3.5 rounded-2xl text-xs border border-red-500/30 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Keluar / Ganti Akun
              </button>

              <button
                onClick={() => setProfileModal(false)}
                className="flex-1 gradient-badge text-amber-300 font-bold py-3.5 rounded-2xl text-xs border border-amber-500/40"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER LOGIN & AUTO-REGISTRATION MODAL */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-amber-500/30 text-gray-100 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative">
            
            <button
              onClick={() => setAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            {authStep === 'phone' ? (
              /* STEP 1: Phone Login */
              <form onSubmit={handleCheckPhone} className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-2xl gradient-badge border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white">Masuk / Pesan Akun</h3>
                    <p className="text-[11px] text-gray-400">Masukkan Nomor HP Anda untuk mulai memesan</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-gray-300 block text-xs uppercase tracking-wider">
                    Nomor HP / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 08123456789"
                      value={inputPhone}
                      onChange={e => setInputPhone(e.target.value)}
                      className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs text-gray-100 font-mono tracking-wide"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic">
                    *Jika Nomor HP belum terdaftar, Anda akan langsung diarahkan ke pendaftaran akun baru.
                  </p>
                </div>

                {authError && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full gradient-gold text-gray-950 font-black py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <span>Memeriksa Nomor HP...</span>
                  ) : (
                    <>
                      <span>Lanjutkan</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: New Customer Registration */
              <form onSubmit={handleRegisterCustomer} className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-2xl gradient-badge border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white">Registrasi Pelanggan Baru</h3>
                    <p className="text-[11px] text-amber-400">Nomor HP belum terdaftar di sistem</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-gray-300 block text-xs uppercase tracking-wider mb-1">
                      Nomor HP
                    </label>
                    <input
                      type="text"
                      disabled
                      value={inputPhone}
                      className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-amber-400 font-mono opacity-80 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-300 block text-xs uppercase tracking-wider mb-1">
                      Nama Lengkap Anda
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso"
                        value={inputName}
                        onChange={e => setInputName(e.target.value)}
                        className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {authError && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('phone');
                      setAuthError('');
                    }}
                    className="w-1/3 bg-gray-900 text-gray-300 hover:text-white font-bold py-3.5 rounded-2xl text-xs border border-white/10"
                  >
                    Ubah No HP
                  </button>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 gradient-gold text-gray-950 font-black py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <span>Mendaftarkan...</span>
                    ) : (
                      <span>Daftar & Lanjut Pesan</span>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
