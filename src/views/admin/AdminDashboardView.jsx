import React, { useState } from 'react';
import { 
  BarChart3, Package, DollarSign, Plus, Edit3, Trash2, 
  CheckCircle, XCircle, TrendingUp, Coffee, FileSpreadsheet, Sparkles, QrCode
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

export default function AdminDashboardView({ 
  products, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductAvailability,
  orders
}) {
  const [adminTab, setAdminTab] = useState('financial'); // 'financial' | 'products'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Product Modal State
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: 'coffee',
    price: '',
    description: '',
    imageUrl: '',
    isAvailable: true
  });

  // Calculate Financial Statistics
  const completedOrders = orders.filter(o => o.paymentStatus === 'paid' || o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalSubtotal = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalTax = completedOrders.reduce((sum, o) => sum + o.tax, 0);
  const totalOrdersCount = completedOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Revenue by Payment Method
  const cashRevenue = completedOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
  const qrisRevenue = completedOrders.filter(o => o.paymentMethod === 'qris').reduce((sum, o) => sum + o.total, 0);

  // Calculate Top Products
  const itemSalesMap = {};
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      if (!itemSalesMap[item.productName]) {
        itemSalesMap[item.productName] = { name: item.productName, qty: 0, total: 0 };
      }
      itemSalesMap[item.productName].qty += item.quantity;
      itemSalesMap[item.productName].total += item.subtotal;
    });
  });
  const topProducts = Object.values(itemSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Form Handlers
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      categoryId: 'coffee',
      price: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      isAvailable: true
    });
    setProductModal(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      categoryId: prod.categoryId,
      price: prod.price.toString(),
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      isAvailable: prod.isAvailable
    });
    setProductModal(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.price) || 0;
    
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        categoryId: formData.categoryId,
        price: priceNum,
        description: formData.description,
        imageUrl: formData.imageUrl,
        isAvailable: formData.isAvailable
      });
    } else {
      const newProd = {
        id: 'prod-' + Date.now(),
        name: formData.name,
        categoryId: formData.categoryId,
        price: priceNum,
        description: formData.description,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
        isAvailable: formData.isAvailable,
        variants: []
      };
      addProduct(newProd);
    }
    setProductModal(false);
  };

  // Filter Products List
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-28">
      
      {/* Admin Dashboard Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-amber-500/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full gradient-badge text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Admin Control Panel (/admin)
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            Kelola Produk, Harga & Laporan Keuangan
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Pantau omset harian, atur harga menu, dan ketersediaan stok cafe secara terpusat.
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 bg-gray-950/80 p-1.5 rounded-2xl border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setAdminTab('financial')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              adminTab === 'financial'
                ? 'gradient-gold text-gray-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Laporan Keuangan</span>
          </button>

          <button
            onClick={() => setAdminTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              adminTab === 'products'
                ? 'gradient-gold text-gray-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Kelola Produk ({products.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FINANCIAL REPORTS & ANALYTICS */}
      {adminTab === 'financial' && (
        <div className="space-y-6">
          
          {/* Top Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-card p-5 rounded-3xl border border-amber-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Total Omset / Pendapatan</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-amber-400 font-mono">
                {formatRupiah(totalRevenue)}
              </h3>
              <p className="text-[11px] text-gray-400">Dari {totalOrdersCount} transaksi terverifikasi</p>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-blue-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Rata-Rata Transaksi</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-blue-400 font-mono">
                {formatRupiah(avgOrderValue)}
              </h3>
              <p className="text-[11px] text-gray-400">Rerata pembelanjaan per meja</p>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-emerald-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Pembayaran Tunai (Cash)</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                {formatRupiah(cashRevenue)}
              </h3>
              <p className="text-[11px] text-gray-400">Pemasukan cash via Kasir</p>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-purple-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Pembayaran Digital (QRIS)</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-purple-400 font-mono">
                {formatRupiah(qrisRevenue)}
              </h3>
              <p className="text-[11px] text-gray-400">Pemasukan e-wallet / QRIS</p>
            </div>
          </div>

          {/* Payment Breakdown & Top Selling Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Selling Menu Card */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 lg:col-span-2">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-amber-400" /> Menu Terlaris (Top Selling Items)
                </h3>
                <span className="text-xs text-amber-400 font-semibold">Total Terjual</span>
              </div>

              <div className="space-y-3 text-xs">
                {topProducts.length === 0 ? (
                  <p className="text-gray-500 italic py-6 text-center">Belum ada data penjualan menu.</p>
                ) : (
                  topProducts.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-950/80 p-3.5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl gradient-gold text-gray-950 font-black flex items-center justify-center text-xs">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <span className="text-[11px] text-gray-400">{item.qty} porsi terjual</span>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {formatRupiah(item.total)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tax & Financial Summary */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" /> Ringkasan Kas
              </h3>

              <div className="space-y-3 text-xs text-gray-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Total Penjualan Kotor (Subtotal)</span>
                  <span className="font-mono text-white font-bold">{formatRupiah(totalSubtotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Total Pajak Restoran (PB1 10%)</span>
                  <span className="font-mono text-amber-400 font-bold">{formatRupiah(totalTax)}</span>
                </div>
                <div className="flex justify-between py-2 font-black text-sm text-white border-t border-amber-500/30 pt-3">
                  <span>Pemasukan Bersih Resto</span>
                  <span className="text-amber-400 font-mono">{formatRupiah(totalRevenue)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Transactions History Table */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" /> Riwayat Seluruh Transaksi ({orders.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950 text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-3">No. Nota</th>
                    <th className="p-3">Tanggal & Waktu</th>
                    <th className="p-3">Meja</th>
                    <th className="p-3">Pelanggan</th>
                    <th className="p-3">Metode</th>
                    <th className="p-3">Total Tagihan</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map(ord => (
                    <tr key={ord.id} className="hover:bg-white/5 transition">
                      <td className="p-3 font-mono font-bold text-amber-400">{ord.orderNumber}</td>
                      <td className="p-3 text-gray-400">{formatDateTime(ord.createdAt)}</td>
                      <td className="p-3 font-bold text-white">Meja {ord.tableNumber}</td>
                      <td className="p-3">{ord.customerName}</td>
                      <td className="p-3 uppercase font-mono text-[11px] font-bold text-gray-300">{ord.paymentMethod}</td>
                      <td className="p-3 font-mono font-bold text-white">{formatRupiah(ord.total)}</td>
                      <td className="p-3">
                        {ord.paymentStatus === 'paid' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            LUNAS
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            MENUNGGU BAYAR
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PRODUCT & PRICING MANAGEMENT */}
      {adminTab === 'products' && (
        <div className="space-y-6">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'gradient-gold text-gray-950 font-black shadow-lg shadow-amber-500/20'
                      : 'glass-panel text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full md:w-64 glass-input rounded-2xl px-4 py-2.5 text-xs text-gray-100"
              />

              <button
                onClick={openAddModal}
                className="gradient-gold text-gray-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 whitespace-nowrap transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950 text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Harga (Rp)</th>
                    <th className="p-4">Status Stok</th>
                    <th className="p-4 text-center">Aksi Edit / Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map(prod => (
                    <tr key={prod.id} className="hover:bg-white/5 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-amber-500/20 shadow-md"
                          />
                          <div>
                            <h4 className="font-bold text-white text-sm">{prod.name}</h4>
                            <p className="text-[11px] text-gray-400 line-clamp-1">{prod.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 uppercase font-mono text-[11px] text-amber-400 font-bold">
                        {prod.categoryId}
                      </td>

                      <td className="p-4 font-mono font-bold text-white text-sm">
                        {formatRupiah(prod.price)}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => toggleProductAvailability(prod.id)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition ${
                            prod.isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {prod.isAvailable ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{prod.isAvailable ? 'Tersedia' : 'Stok Habis'}</span>
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl transition"
                            title="Edit Produk & Harga"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (window.confirm(`Yakin ingin menghapus produk "${prod.name}"?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-xl transition"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-amber-500/30 text-gray-100 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl">
            
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                {editingProduct ? 'Edit Data Produk & Harga' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setProductModal(false)} className="text-gray-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Nama Produk / Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Caramel Latte Special"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full glass-input rounded-2xl p-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Kategori</label>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="coffee">Espresso & Coffee</option>
                    <option value="non-coffee">Non-Coffee</option>
                    <option value="food">Makanan Berat</option>
                    <option value="snack">Snack & Pastry</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 35000"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full glass-input rounded-2xl p-3 text-xs text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows="2"
                  placeholder="Deskripsi bahan dan cita rasa menu..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full glass-input rounded-2xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">URL Gambar (Unsplash / Online Image)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full glass-input rounded-2xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formData.isAvailable}
                  onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="availCheck" className="text-xs font-bold text-gray-200">
                  Produk Tersedia (Stok Ready)
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-gray-900 text-gray-400 hover:text-white border border-white/10 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="gradient-gold text-gray-950 font-black px-5 py-2.5 rounded-2xl shadow-lg shadow-amber-500/25"
                >
                  Simpan Produk
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
