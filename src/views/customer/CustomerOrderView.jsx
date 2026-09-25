import React, { useState } from 'react';
import { 
  Coffee, CupSoda, Milk, Utensils, Cookie, Plus, ShoppingBag, 
  QrCode, AlertCircle, Clock, ChevronRight, X, Sparkles, DollarSign,
  Flame, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { formatRupiah } from '../../utils/formatters';

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
  
  // Customization modal state
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [itemNotes, setItemNotes] = useState('');
  const [itemQty, setItemQty] = useState(1);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  // Checkout modal state
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Open product customization modal
  const openCustomization = (product) => {
    setActiveProduct(product);
    setItemQty(1);
    setItemNotes('');
    
    const initialVariants = {};
    if (product.variants) {
      product.variants.forEach(vGroup => {
        if (vGroup.options.length > 0) {
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
    const variantLabels = Object.values(selectedVariants).map(v => v.label);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in pb-28 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 glass-panel bg-emerald-950/90 text-emerald-300 px-5 py-3 rounded-2xl border border-emerald-500/40 shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-bold w-[90%] max-w-sm justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* HERO BANNER: Artisan Cafe & Table Session */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/80 via-gray-950 to-amber-900/40 border border-amber-500/20 p-5 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full gradient-badge text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> TERVERIFIKASI QR CODE MEJA
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Selamat Datang di <span className="gradient-text font-black">Meja {selectedTable.number}</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
              Nikmati racikan kopi artisan dan hidangan spesial. Pesan langsung dari meja tanpa perlu mengantri di kasir.
            </p>
          </div>

          <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 space-y-2 w-full md:w-auto min-w-[220px]">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Status Meja:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Terhubung
              </span>
            </div>
            <div className="text-xs text-gray-300 font-semibold flex justify-between border-t border-white/5 pt-2">
              <span>Token QR:</span>
              <span className="font-mono text-amber-400 font-bold">{selectedTable.token}</span>
            </div>
            <div className="text-[11px] text-gray-400 flex justify-between">
              <span>Kapasitas:</span>
              <span className="text-white font-medium">{selectedTable.capacity} Kursi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE ORDERS STATUS TRACKER */}
      {activeTableOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            Pesanan Meja Ini Yang Sedang Berjalan ({activeTableOrders.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTableOrders.map(order => (
              <div key={order.id} className="glass-card rounded-2xl p-4 sm:p-5 border border-amber-500/30 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-amber-400 font-bold">{order.orderNumber}</span>
                    <h4 className="font-bold text-white text-sm sm:text-base">{order.customerName}</h4>
                  </div>
                  
                  {order.status === 'pending_payment' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Menunggu Bayar Kasir
                    </span>
                  )}
                  {order.status === 'preparing' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse">
                      Sedang Dibuat Barista
                    </span>
                  )}
                  {order.status === 'ready' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Siap Disajikan
                    </span>
                  )}
                  {order.status === 'completed' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Selesai
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className={`h-full rounded-full transition-all duration-700 ${
                    order.status === 'pending_payment' ? 'w-1/4 gradient-gold' :
                    order.status === 'preparing' ? 'w-2/4 bg-blue-500' :
                    order.status === 'ready' ? 'w-3/4 bg-purple-500' : 'w-full bg-emerald-500'
                  }`} />
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 border-t border-white/5 pt-3">
                  <span>{order.items.length} Menu • Total: <strong className="text-amber-400 font-mono text-xs sm:text-sm">{formatRupiah(order.total)}</strong></span>
                  <span className="uppercase font-mono text-[10px] bg-gray-950 px-2 py-0.5 rounded-lg border border-white/10 font-bold text-gray-300">
                    {order.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES SLIDER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                  isSelected
                    ? 'gradient-gold text-gray-950 shadow-lg shadow-amber-500/25 scale-[1.03]'
                    : 'glass-panel text-gray-400 hover:text-white hover:border-amber-500/30'
                }`}
              >
                {getCategoryIcon(cat.icon)}
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
            className="w-full glass-input rounded-2xl pl-4 pr-10 py-2 sm:py-2.5 text-xs text-gray-100 placeholder-gray-500"
          />
        </div>
      </div>      {/* PRODUCT GRID - 2 COLUMNS ON MOBILE */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {filteredProducts.map(product => {
          const inCartQty = cart
            .filter(i => i.productId === product.id)
            .reduce((total, i) => total + i.quantity, 0);

          return (
            <div
              key={product.id}
              className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between group relative border border-white/5 hover:border-amber-500/40"
            >
              <div>
                {/* Product Image Header */}
                <div className="relative h-36 sm:h-52 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181412] via-transparent to-black/30 opacity-90" />
                  
                  {/* Price Badge */}
                  <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 glass-panel bg-gray-950/80 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black text-amber-400 border border-amber-500/30 font-mono shadow-lg">
                    {formatRupiah(product.price)}
                  </div>

                  {/* Quantity In Cart Badge */}
                  {inCartQty > 0 && (
                    <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 gradient-gold text-gray-950 font-black px-2.5 py-1 rounded-xl text-[10px] sm:text-xs shadow-xl border border-amber-300/50 flex items-center gap-1 animate-pulse">
                      <span>{inCartQty}x</span> di Keranjang
                    </div>
                  )}

                  {/* Tag Badge */}
                  {inCartQty === 0 && (
                    <div className="hidden sm:flex absolute top-3.5 right-3.5 bg-amber-500/20 text-amber-300 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border border-amber-500/40 items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" /> Best Seller
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-3 sm:p-5 space-y-1 sm:space-y-2">
                  <h3 className="font-bold text-gray-100 text-xs sm:text-lg group-hover:text-amber-400 transition-colors line-clamp-1 sm:line-clamp-none">
                    {product.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="p-3 sm:p-5 pt-0">
                <button
                  onClick={() => openCustomization(product)}
                  className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all duration-300 shadow-lg ${
                    inCartQty > 0
                      ? 'gradient-badge text-amber-300 border border-amber-500/60 hover:bg-amber-500 hover:text-gray-950'
                      : 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 hover:from-amber-600 hover:to-amber-500 text-amber-400 hover:text-gray-950 border border-amber-500/40 hover:shadow-amber-500/25'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{inCartQty > 0 ? `Tambah Lagi (${inCartQty}x)` : 'Pilih Varian & Pesan'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PRODUCT CUSTOMIZATION MODAL */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel text-gray-100 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-4 max-h-[90vh] flex flex-col border border-amber-500/30">
            
            {/* Modal Image Header */}
            <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
              <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181412] via-gray-950/50 to-transparent" />
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-4 right-4 bg-gray-950/80 p-2 rounded-full text-gray-300 hover:text-white border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-5 right-5 space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">{activeProduct.name}</h3>
                <p className="text-xs text-amber-400 font-extrabold font-mono">
                  Harga dasar: {formatRupiah(activeProduct.price)}
                </p>
              </div>
            </div>

            {/* Options List */}
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-xs">
              {activeProduct.variants && activeProduct.variants.length > 0 ? (
                activeProduct.variants.map((vGroup, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="font-extrabold text-gray-200 block text-xs tracking-wide uppercase flex items-center justify-between">
                      <span>{vGroup.name}</span>
                      <span className="text-[10px] text-amber-400 font-normal">Pilih salah satu</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {vGroup.options.map((opt, optIdx) => {
                        const isSelected = selectedVariants[vGroup.group]?.label === opt.label;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => setSelectedVariants({ ...selectedVariants, [vGroup.group]: opt })}
                            className={`p-2.5 sm:p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${
                              isSelected
                                ? 'gradient-badge border-amber-500 text-amber-300 font-extrabold shadow-lg shadow-amber-500/20 scale-[1.02]'
                                : 'bg-gray-950/60 border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {opt.extraPrice > 0 && (
                              <span className="text-[10px] text-amber-400 font-mono">+{formatRupiah(opt.extraPrice)}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">Menu ini siap disajikan tanpa opsi varian tambahan.</p>
              )}

              {/* Notes */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <label className="font-extrabold text-gray-200 block text-xs uppercase tracking-wide">
                  Catatan Khusus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kurangi es, tanpa sedotan..."
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  className="w-full glass-input rounded-2xl p-3 text-xs text-gray-200"
                />
              </div>
            </div>

            {/* Modal Footer with Clear Quantity Selector */}
            <div className="p-4 sm:p-5 bg-gray-950 border-t border-white/10 flex flex-col gap-3 shrink-0">
              
              {/* Quantity Selector Header */}
              <div className="flex items-center justify-between bg-gray-900/80 p-2.5 rounded-2xl border border-white/10">
                <span className="text-xs font-extrabold text-gray-200 uppercase tracking-wider">Jumlah Pesanan (Qty):</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                    className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-gray-950 flex items-center justify-center font-black text-gray-200 text-sm transition-all border border-white/10"
                  >
                    -
                  </button>
                  <span className="font-black text-sm w-6 text-center text-amber-400 font-mono text-base">{itemQty}</span>
                  <button
                    onClick={() => setItemQty(itemQty + 1)}
                    className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-gray-950 flex items-center justify-center font-black text-gray-200 text-sm transition-all border border-white/10"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Submit Button */}
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-between gradient-gold text-gray-950 font-black py-3.5 px-5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition transform active:scale-95"
              >
                <span>Tambah {itemQty}x ke Keranjang</span>
                <span className="font-mono text-sm">{formatRupiah(calculateCustomizedPrice() * itemQty)}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CART DRAWER MODAL */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border-l border-amber-500/20 w-full max-w-md h-full flex flex-col justify-between p-5 sm:p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-white font-extrabold text-base">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>Keranjang Pesanan (Meja {selectedTable.number})</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                  <ShoppingBag className="w-16 h-16 opacity-20 text-amber-400" />
                  <p className="text-xs font-semibold text-gray-400">Keranjang Anda masih kosong</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="bg-gray-950/80 p-3.5 sm:p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white">{item.productName}</h4>
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <p className="text-[10px] text-amber-400">{item.selectedVariants.join(' • ')}</p>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-gray-400 italic">"{item.notes}"</p>
                        )}
                      </div>
                      <span className="font-bold font-mono text-amber-400 text-sm">
                        {formatRupiah(item.unitPrice * item.quantity)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 rounded-lg bg-gray-800 text-gray-300 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold text-white text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 rounded-lg bg-gray-800 text-gray-300 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-4 text-xs">
                <div className="space-y-2 text-gray-400 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatRupiah(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak Restoran (PB1 10%)</span>
                    <span>{formatRupiah(cartTax)}</span>
                  </div>
                  <div className="flex justify-between font-black text-lg text-white pt-2 border-t border-white/10">
                    <span>Total Pembayaran</span>
                    <span className="text-amber-400 font-mono">{formatRupiah(cartTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutModal(true)}
                  className="w-full gradient-gold text-gray-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 text-sm transition transform active:scale-95"
                >
                  <span>Lanjut ke Pembayaran</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT & PAYMENT METHOD MODAL */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-amber-500/30 text-gray-100 w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl">
            
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Konfirmasi Pembayaran
              </h3>
              <button onClick={() => setCheckoutModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1.5 uppercase text-[10px] tracking-wider">Nama Pemesan</label>
                <input
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full glass-input rounded-2xl p-3 text-xs text-gray-100"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1.5 uppercase text-[10px] tracking-wider">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'qris'
                        ? 'gradient-badge border-amber-500 text-amber-300 font-extrabold shadow-lg shadow-amber-500/20'
                        : 'bg-gray-950/60 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">QRIS / E-Wallet</span>
                      <QrCode className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-gray-400">Bayar via GoPay, OVO, BCA</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'cash'
                        ? 'gradient-badge border-amber-500 text-amber-300 font-extrabold shadow-lg shadow-amber-500/20'
                        : 'bg-gray-950/60 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Tunai di Kasir</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-gray-400">Bayar cash saat kasir memproses</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'qris' ? (
                <div className="bg-gray-950/90 p-4 rounded-2xl border border-white/10 text-center space-y-2">
                  <p className="text-[11px] text-gray-400 font-medium">Scan Kode QRIS di bawah ini:</p>
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl border border-amber-500/40">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 bg-gray-950 rounded-xl flex items-center justify-center p-2">
                      <QrCode className="w-full h-full text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-amber-400 font-extrabold font-mono">Total: {formatRupiah(cartTotal)}</p>
                </div>
              ) : (
                <div className="gradient-badge p-3.5 rounded-2xl border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Instruksi Pembayaran Tunai:
                  </div>
                  <p className="text-gray-300 text-[11px]">
                    Pesanan Anda akan dikirim ke Kasir dengan status <strong>Menunggu Bayar</strong>. Silakan menuju kasir untuk melakukan pembayaran.
                  </p>
                </div>
              )}
            </div>

            <button
              disabled={isProcessing}
              onClick={() => handleFinalCheckout(paymentMethod === 'qris')}
              className="w-full gradient-gold text-gray-950 font-black py-3.5 sm:py-4 rounded-2xl text-xs shadow-xl shadow-amber-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
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

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-md mx-auto">
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

    </div>
  );
}
