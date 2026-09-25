import React, { useState } from 'react';
import { 
  Coffee, CupSoda, Milk, Utensils, Cookie, Plus, ShoppingBag, 
  Check, QrCode, AlertCircle, Clock, ChevronRight, X, Sparkles, DollarSign
} from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/mockData';

export default function CustomerOrderView({ 
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

  // Checkout modal state
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris' or 'cash'
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter products
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCat = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Open product customization modal
  const openCustomization = (product) => {
    setActiveProduct(product);
    setItemQty(1);
    setItemNotes('');
    
    // Default initial variant picks
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

  // Add customized item to cart
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

    setActiveProduct(null);
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

  // Find active orders for current table
  const activeTableOrders = orders.filter(o => o.tableNumber === selectedTable.number);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-24">
      
      {/* Table Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-900/40 via-gray-900 to-amber-950/60 border border-amber-500/30 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold">
              <QrCode className="w-3.5 h-3.5" /> Scan QR Terverifikasi
            </div>
            <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              Selamat Datang di <span className="text-amber-500 font-extrabold">Meja {selectedTable.number}</span>
            </h2>
            <p className="text-xs text-gray-300">
              Pesan makanan & minuman langsung dari HP Anda tanpa antri di kasir.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur px-4 py-2 rounded-xl border border-gray-800 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-300">Sesi Aktif: <strong className="text-amber-400">{selectedTable.token}</strong></span>
          </div>
        </div>
      </div>

      {/* Active Order Tracker (If customer has placed orders on this table) */}
      {activeTableOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Status Pesanan Meja Ini ({activeTableOrders.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTableOrders.map(order => (
              <div key={order.id} className="glass rounded-xl p-4 border border-amber-500/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-400">Nota: {order.orderNumber}</span>
                    <h4 className="font-bold text-gray-200 text-sm">{order.customerName}</h4>
                  </div>
                  
                  {order.status === 'pending_payment' && (
                    <span className="badge badge-pending">Menunggu Bayar Kasir</span>
                  )}
                  {order.status === 'preparing' && (
                    <span className="badge badge-preparing animate-pulse">Dapur Menyiapkan</span>
                  )}
                  {order.status === 'ready' && (
                    <span className="badge badge-ready">Siap Disajikan</span>
                  )}
                  {order.status === 'completed' && (
                    <span className="badge badge-success">Selesai</span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
                  <div className={`h-full transition-all duration-500 ${
                    order.status === 'pending_payment' ? 'w-1/4 bg-amber-500' :
                    order.status === 'preparing' ? 'w-2/4 bg-blue-500' :
                    order.status === 'ready' ? 'w-3/4 bg-purple-500' : 'w-full bg-emerald-500'
                  }`} />
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{order.items.length} Menu • Total: <strong className="text-amber-400">Rp {order.total.toLocaleString('id-ID')}</strong></span>
                  <span className="uppercase font-mono text-[10px] bg-gray-800 px-2 py-0.5 rounded">{order.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Cari kopi, makanan..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="glass rounded-2xl overflow-hidden border border-gray-800 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-44 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-3 left-3 bg-gray-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-bold text-amber-400 border border-amber-500/30">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-gray-100 text-base group-hover:text-amber-400 transition">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => openCustomization(product)}
                className="w-full flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Pilih & Kustomisasi</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PRODUCT CUSTOMIZATION MODAL */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 text-gray-100 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="relative h-48 overflow-hidden shrink-0">
              <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-3 right-3 bg-gray-900/80 p-1.5 rounded-full text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-xl font-bold text-white">{activeProduct.name}</h3>
                <p className="text-xs text-amber-400 font-semibold">
                  Harga dasar: Rp {activeProduct.price.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Variants Body (Scrollable) */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {activeProduct.variants && activeProduct.variants.length > 0 ? (
                activeProduct.variants.map((vGroup, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="font-bold text-gray-300 block">{vGroup.name}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {vGroup.options.map((opt, optIdx) => {
                        const isSelected = selectedVariants[vGroup.group]?.label === opt.label;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => setSelectedVariants({ ...selectedVariants, [vGroup.group]: opt })}
                            className={`p-2.5 rounded-xl border text-left flex justify-between items-center transition ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {opt.extraPrice > 0 && (
                              <span className="text-[10px] text-amber-400 font-mono">+Rp {opt.extraPrice.toLocaleString('id-ID')}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">Tidak ada varian tambahan untuk menu ini.</p>
              )}

              {/* Notes */}
              <div className="space-y-1 pt-2 border-t border-gray-800">
                <label className="font-bold text-gray-300 block">Catatan Pesanan (Optional)</label>
                <input
                  type="text"
                  placeholder="Misal: Kurangi es, tanpa sedotan..."
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between gap-4 shrink-0">
              {/* Qty Counter */}
              <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-1.5 border border-gray-700">
                <button
                  onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center font-bold text-gray-200"
                >
                  -
                </button>
                <span className="font-bold text-sm w-4 text-center">{itemQty}</span>
                <button
                  onClick={() => setItemQty(itemQty + 1)}
                  className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center font-bold text-gray-200"
                >
                  +
                </button>
              </div>

              {/* Submit Add */}
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-between bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg shadow-amber-600/30 transition"
              >
                <span>Tambah ke Keranjang</span>
                <span>Rp {(calculateCustomizedPrice() * itemQty).toLocaleString('id-ID')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CART DRAWER / MODAL */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border-l border-gray-800 w-full max-w-md h-full flex flex-col justify-between p-5 space-y-4 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-gray-100 font-bold">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <span>Keranjang Pesanan (Meja {selectedTable.number})</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                  <ShoppingBag className="w-12 h-12 opacity-30" />
                  <p className="text-xs">Keranjang Anda masih kosong</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="bg-gray-800/60 p-3 rounded-xl border border-gray-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-200">{item.productName}</h4>
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <p className="text-[10px] text-amber-400">{item.selectedVariants.join(' • ')}</p>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-gray-400 italic">"Catatan: {item.notes}"</p>
                        )}
                      </div>
                      <span className="font-bold font-mono text-gray-300">
                        Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 rounded bg-gray-700 text-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 rounded bg-gray-700 text-gray-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary & Checkout Button */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-gray-800 space-y-3 text-xs">
                <div className="space-y-1 text-gray-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak Restoran (10%)</span>
                    <span>Rp {cartTax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-gray-100 pt-1 border-t border-gray-800">
                    <span>Total Pembayaran</span>
                    <span className="text-amber-400">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutModal(true)}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition"
                >
                  <span>Lanjut ke Pembayaran</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 text-gray-100 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Konfirmasi & Metode Bayar
              </h3>
              <button onClick={() => setCheckoutModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Nama Pemesan</label>
                <input
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                      paymentMethod === 'qris'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-200">QRIS / E-Wallet</span>
                      <QrCode className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-gray-400">Bayar via GoPay, Shopee, OVO, BCA</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                      paymentMethod === 'cash'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-200">Tunai di Kasir</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-gray-400">Bayar cash saat kasir memproses</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Screen */}
              {paymentMethod === 'qris' ? (
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-center space-y-2">
                  <p className="text-[11px] text-gray-400">Kode QRIS Otomatis Tergenerasi:</p>
                  <div className="bg-white p-3 rounded-xl inline-block shadow-lg">
                    {/* Simulated QR Code Graphic */}
                    <div className="w-36 h-36 bg-gray-900 rounded flex items-center justify-center p-2">
                      <QrCode className="w-full h-full text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-400 font-semibold">Total: Rp {cartTotal.toLocaleString('id-ID')}</p>
                </div>
              ) : (
                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4" /> Instruksi Pembayaran Tunai:
                  </div>
                  <p className="text-gray-300">
                    Pesanan Anda akan dikirim ke Kasir dengan status <strong>Menunggu Bayar</strong>. Silakan menuju kasir untuk melakukan pembayaran.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                disabled={isProcessing}
                onClick={() => handleFinalCheckout(paymentMethod === 'qris')}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>Memproses Transaksi...</span>
                ) : paymentMethod === 'qris' ? (
                  <span>Simulasikan Bayar QRIS (Lunas)</span>
                ) : (
                  <span>Kirim Pesanan ke Kasir</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar (For Mobile Experience) */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full glass bg-amber-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-amber-400/30 hover:bg-amber-500 transition"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-950/40 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <div className="text-left">
                <p className="font-bold text-xs">Lihat Pesanan Meja {selectedTable.number}</p>
                <p className="text-[10px] text-amber-100 opacity-90">{cart.length} Jenis Menu dipilih</p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-extrabold text-sm">
              <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

    </div>
  );
}
