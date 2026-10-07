import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, DollarSign, Plus, Edit3, Trash2, 
  CheckCircle, XCircle, TrendingUp, Coffee, FileSpreadsheet, Sparkles, QrCode,
  LayoutDashboard, Layers, Table as TableIcon, Receipt, Users, Menu, Bell, ChevronDown, RefreshCw, Search, LogOut, Clock,
  Upload, Image as ImageIcon, FileUp, Camera, Check, X
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { apiService } from '../../services/apiService';

export default function AdminDashboardView({ 
  products = [], 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductAvailability,
  orders = [],
  tables = [],
  staffUser,
  onLogoutStaff
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('products'); // 'dashboard' | 'products' | 'categories' | 'tables' | 'orders' | 'financial'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);

  // Categories State
  const [categoriesList, setCategoriesList] = useState([
    { id: 'coffee', name: 'Espresso & Coffee', slug: 'coffee', display_order: 1 },
    { id: 'non-coffee', name: 'Non-Coffee', slug: 'non-coffee', display_order: 2 },
    { id: 'food', name: 'Makanan Berat', slug: 'food', display_order: 3 },
    { id: 'snack', name: 'Snack & Pastry', slug: 'snack', display_order: 4 }
  ]);

  useEffect(() => {
    const fetchCats = async () => {
      const fetched = await apiService.getCategories();
      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        setCategoriesList(fetched);
      }
    };
    fetchCats();
  }, []);

  // Category Modal State
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({
    name: '',
    slug: '',
    displayOrder: '1'
  });

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatFormData({
      name: '',
      slug: '',
      displayOrder: (categoriesList.length + 1).toString()
    });
    setCategoryModal(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCatFormData({
      name: cat.name,
      slug: cat.slug || cat.id,
      displayOrder: (cat.display_order || 1).toString()
    });
    setCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const orderNum = parseInt(catFormData.displayOrder) || 1;
    const slugName = catFormData.slug.trim() || catFormData.name.toLowerCase().replace(/\s+/g, '-');

    if (editingCategory) {
      const updatedCat = {
        name: catFormData.name,
        slug: slugName,
        display_order: orderNum
      };
      setCategoriesList(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...updatedCat } : c));
      await apiService.updateCategory(editingCategory.id, updatedCat);
    } else {
      const newCat = {
        id: slugName || ('cat-' + Date.now()),
        name: catFormData.name,
        slug: slugName,
        display_order: orderNum
      };
      setCategoriesList(prev => [...prev, newCat]);
      await apiService.createCategory(newCat);
    }
    setCategoryModal(false);
  };

  const handleDeleteCategory = async (catId) => {
    if (window.confirm('Hapus kategori ini dari katalog?')) {
      setCategoriesList(prev => prev.filter(c => c.id !== catId));
      await apiService.deleteCategory(catId);
    }
  };

  // Live Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date display matching portal header: "7 Oktober 2026 • 09:35:05"
  const formattedDateString = currentTime.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' • ' + currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Product Modal State
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = React.useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: 'coffee',
    price: '',
    description: '',
    imageUrl: '',
    isAvailable: true
  });

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file foto terlalu besar (Maksimal 8 MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, imageUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

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

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Form Handlers
  const openAddModal = () => {
    setEditingProduct(null);
    setShowUrlInput(false);
    setFormData({
      name: '',
      categoryId: categoriesList[0]?.id || 'coffee',
      price: '',
      description: '',
      imageUrl: '',
      isAvailable: true
    });
    setProductModal(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setShowUrlInput(false);
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
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'available' && p.isAvailable) || 
      (selectedStatus === 'unavailable' && !p.isAvailable);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* LEFT SIDEBAR (DARK NAVY PORTAL MENU) */}
      <aside className={`bg-[#0f172a] text-slate-300 w-64 min-h-screen shrink-0 transition-all duration-300 z-30 flex flex-col justify-between ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-64 hidden lg:block'
      }`}>
        <div>
          {/* Top Portal Brand Header */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              P
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-wider font-heading uppercase">
                PORTAL
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">CAFFE POS SYSTEM</p>
            </div>
          </div>

          {/* Sub-Brand Admin Card */}
          <div className="p-3">
            <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3 shadow-inner">
              <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-extrabold text-xs text-white truncate">CAFFE POS RESTO</h2>
                <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white mt-0.5">
                  ADMIN
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Menu List */}
          <nav className="p-3 space-y-5 text-xs font-semibold">
            
            {/* MAIN MENU */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-3 block mb-2">
                MAIN MENU
              </span>

              <button
                onClick={() => setActiveMenu('products')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeMenu === 'products'
                    ? 'bg-blue-600 text-white font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Kelola Produk / Menu</span>
              </button>

              <button
                onClick={() => setActiveMenu('categories')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeMenu === 'categories'
                    ? 'bg-blue-600 text-white font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Kategori Menu</span>
              </button>

              <button
                onClick={() => setActiveMenu('tables')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeMenu === 'tables'
                    ? 'bg-blue-600 text-white font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>Kelola Meja ({tables.length})</span>
              </button>

              <button
                onClick={() => setActiveMenu('orders')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeMenu === 'orders'
                    ? 'bg-blue-600 text-white font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Riwayat Transaksi</span>
              </button>
            </div>

            {/* LAPORAN & REKAP */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-3 block mb-2">
                LAPORAN & REKAP
              </span>

              <button
                onClick={() => setActiveMenu('financial')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeMenu === 'financial'
                    ? 'bg-blue-600 text-white font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Laporan Keuangan</span>
              </button>
            </div>

          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onLogoutStaff}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi Admin</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-sm sticky top-0 z-20">
          {/* Left: Sidebar Toggle Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Middle: Real-time Date/Clock Badge */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono">{formattedDateString}</span>
          </div>

          {/* Right: Notifications & Profile Pill */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-full transition text-xs font-extrabold text-slate-800"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  A
                </div>
                <span>CAFFE POS ADMIN</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 text-xs z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{staffUser ? staffUser.name : 'Administrator'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">admin@caffe.com</p>
                  </div>
                  <button
                    onClick={onLogoutStaff}
                    className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Sesi</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="p-4 sm:p-6 space-y-6 flex-1">
          
          {/* SECTION 1: KELOLA PRODUK / MENU */}
          {activeMenu === 'products' && (
            <div className="space-y-6">
              
              {/* Top Title Bar Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-heading tracking-tight">
                    <Package className="w-5 h-5 text-blue-600" />
                    Kelola Produk & Menu CaffePOS
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Total <strong className="text-slate-800">{products.length}</strong> produk menu makanan & minuman aktif di katalog.
                  </p>
                </div>

                <button
                  onClick={openAddModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              {/* Search & Filter Controls Bar */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                {/* Search Field */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari agenda kegiatan / produk..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                {/* Filter Dropdowns */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="bg-slate-50/60 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="all">Semua Kategori</option>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="bg-slate-50/60 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="all">Semua Status</option>
                    <option value="available">Tersedia</option>
                    <option value="unavailable">Stok Habis</option>
                  </select>

                  <button
                    onClick={handleRefresh}
                    className={`p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Compact Bordered Data Table Layout (table-bordered / table-sm / btn-sm) */}
              <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10 border border-slate-300 bg-slate-100">NO</th>
                        <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">NAMA PRODUK / MENU</th>
                        <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">KATEGORI</th>
                        <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">HARGA</th>
                        <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">STATUS</th>
                        <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">KETERANGAN</th>
                        <th className="py-2.5 px-3 text-center w-20 border border-slate-300 bg-slate-100">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-slate-400 italic text-xs border border-slate-200">
                            Tidak ada data produk ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((prod, idx) => (
                          <tr key={prod.id} className="hover:bg-blue-50/40 transition odd:bg-white even:bg-slate-50/50">
                            <td className="py-2 px-3 text-center font-bold text-slate-500 text-[11px] border border-slate-200">{idx + 1}</td>
                            
                            <td className="py-2 px-3 border border-slate-200">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                                />
                                <div>
                                  <h4 className="font-bold text-slate-800 text-xs leading-tight">{prod.name}</h4>
                                  <span className="text-[9px] text-slate-400 font-mono">ID: {prod.id}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-2 px-3 text-center border border-slate-200">
                              <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded text-[10px] font-bold inline-block uppercase">
                                {prod.categoryId}
                              </span>
                            </td>

                            <td className="py-2 px-3 font-mono font-bold text-slate-900 text-xs border border-slate-200">
                              {formatRupiah(prod.price)}
                            </td>

                            <td className="py-2 px-3 text-center border border-slate-200">
                              <button
                                onClick={() => toggleProductAvailability(prod.id)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition cursor-pointer ${
                                  prod.isAvailable
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300/80'
                                    : 'bg-rose-50 text-rose-700 border border-rose-300/80'
                                }`}
                              >
                                {prod.isAvailable ? 'Tersedia' : 'Stok Habis'}
                              </button>
                            </td>

                            <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate border border-slate-200">
                              {prod.description || '-'}
                            </td>

                            {/* Compact Action Buttons (btn-sm) */}
                            <td className="py-2 px-3 text-center border border-slate-200">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openEditModal(prod)}
                                  className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs transition"
                                  title="Edit Produk"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Yakin ingin menghapus "${prod.name}"?`)) {
                                      deleteProduct(prod.id);
                                    }
                                  }}
                                  className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-2xs transition"
                                  title="Hapus Produk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SECTION: KELOLA KATEGORI MENU */}
          {activeMenu === 'categories' && (
            <div className="space-y-6">
              
              {/* Top Title Bar Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-heading tracking-tight">
                    <Layers className="w-5 h-5 text-blue-600" />
                    Kelola Kategori Menu CaffePOS
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Total <strong className="text-slate-800">{categoriesList.length}</strong> kategori produk aktif.
                  </p>
                </div>

                <button
                  onClick={openAddCategoryModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Tambah Kategori Baru</span>
                </button>
              </div>

              {/* Compact Bordered Data Table Layout (table-bordered / table-sm / btn-sm) */}
              <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10 border border-slate-300 bg-slate-100">NO</th>
                        <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">NAMA KATEGORI</th>
                        <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">SLUG / KODE</th>
                        <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">URUTAN TAMPIL</th>
                        <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">JUMLAH PRODUK</th>
                        <th className="py-2.5 px-3 text-center w-20 border border-slate-300 bg-slate-100">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-10 text-center text-slate-400 italic text-xs border border-slate-200">
                            Tidak ada data kategori ditemukan.
                          </td>
                        </tr>
                      ) : (
                        categoriesList.map((cat, idx) => {
                          const prodCount = products.filter(p => p.categoryId === cat.id || p.categoryId === cat.slug).length;
                          return (
                            <tr key={cat.id || idx} className="hover:bg-blue-50/40 transition odd:bg-white even:bg-slate-50/50">
                              <td className="py-2 px-3 text-center font-bold text-slate-500 text-[11px] border border-slate-200">{idx + 1}</td>
                              
                              <td className="py-2 px-3 border border-slate-200">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-xs">
                                    <Layers className="w-3.5 h-3.5" />
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-xs">{cat.name}</h4>
                                </div>
                              </td>

                              <td className="py-2 px-3 font-mono text-slate-600 text-xs border border-slate-200">
                                <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300/60 font-bold">
                                  {cat.slug || cat.id}
                                </span>
                              </td>

                              <td className="py-2 px-3 text-center font-bold text-slate-800 text-xs border border-slate-200">
                                {cat.display_order || (idx + 1)}
                              </td>

                              <td className="py-2 px-3 text-center border border-slate-200">
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-300/80 px-2 py-0.5 rounded text-[10px] font-extrabold inline-block">
                                  {prodCount} Menu
                                </span>
                              </td>

                              <td className="py-2 px-3 text-center border border-slate-200">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openEditCategoryModal(cat)}
                                    className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs transition"
                                    title="Edit Kategori"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-2xs transition"
                                    title="Hapus Kategori"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 2: LAPORAN KEUANGAN */}
          {activeMenu === 'financial' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Laporan Keuangan & Ringkasan Kas
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ringkasan pendapatan dari pesanan yang telah diselesaikan.
                </p>
              </div>

              {/* Financial Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs text-slate-500 font-bold">Total Omset Penjualan</span>
                  <h3 className="text-2xl font-black text-blue-600 font-mono">{formatRupiah(totalRevenue)}</h3>
                  <p className="text-[11px] text-slate-400">Dari {totalOrdersCount} transaksi lunas</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs text-slate-500 font-bold">Rata-Rata Transaksi</span>
                  <h3 className="text-2xl font-black text-amber-600 font-mono">{formatRupiah(avgOrderValue)}</h3>
                  <p className="text-[11px] text-slate-400">Per nota pemesanan</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs text-slate-500 font-bold">Pemasukan Cash</span>
                  <h3 className="text-2xl font-black text-emerald-600 font-mono">{formatRupiah(cashRevenue)}</h3>
                  <p className="text-[11px] text-slate-400">Pembayaran tunai kasir</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs text-slate-500 font-bold">Pemasukan QRIS</span>
                  <h3 className="text-2xl font-black text-purple-600 font-mono">{formatRupiah(qrisRevenue)}</h3>
                  <p className="text-[11px] text-slate-400">Pembayaran digital</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: KELOLA MEJA */}
          {activeMenu === 'tables' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <TableIcon className="w-6 h-6 text-blue-600" />
                  Kelola Meja & Kode QR Pelanggan
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map(tbl => (
                  <div key={tbl.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900">Meja {tbl.number}</h3>
                      <p className="text-xs text-slate-500">Kapasitas: {tbl.capacity} Kursi</p>
                      <span className="text-[10px] font-mono text-blue-600 font-bold mt-1 block">{tbl.token}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      tbl.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tbl.status === 'available' ? 'Kosong' : 'Terisi'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: RIWAYAT TRANSAKSI */}
          {activeMenu === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <Receipt className="w-6 h-6 text-blue-600" />
                  Riwayat Seluruh Transaksi Pesanan
                </h2>
              </div>

              <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">NO NOTA</th>
                      <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">MEJA</th>
                      <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">PELANGGAN</th>
                      <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">TOTAL</th>
                      <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(ord => (
                      <tr key={ord.id} className="hover:bg-blue-50/40 transition odd:bg-white even:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600 border border-slate-200">{ord.orderNumber}</td>
                        <td className="py-2 px-3 font-bold border border-slate-200">Meja {ord.tableNumber}</td>
                        <td className="py-2 px-3 border border-slate-200">{ord.customerName}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 border border-slate-200">{formatRupiah(ord.total)}</td>
                        <td className="py-2 px-3 border border-slate-200">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300/80' : 'bg-amber-50 text-amber-700 border border-amber-300/80'
                          }`}>
                            {ord.paymentStatus === 'paid' ? 'LUNAS' : 'MENUNGGU BAYAR'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ADD / EDIT PRODUCT MODAL (SUPER SLEEK DESIGN + LOCAL LAPTOP FILE UPLOAD) */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-3xl space-y-5 shadow-2xl border border-slate-200 overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-tight leading-tight font-heading">
                    {editingProduct ? 'Edit Data Produk & Harga' : 'Tambah Produk Menu Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Restoran CaffePOS Multi-Role System</p>
                </div>
              </div>

              <button 
                onClick={() => setProductModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 pt-2 space-y-4 text-xs font-medium">
              
              {/* Nama Produk */}
              <div>
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Nama Produk / Menu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Aren Iced / Truffle Burger"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition"
                />
              </div>

              {/* Kategori & Harga Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                    Kategori Menu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition cursor-pointer"
                  >
                    {categoriesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                    Harga Jual <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      required
                      placeholder="35000"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Deskripsi Singkat */}
              <div>
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows="2"
                  placeholder="Keterangan singkat komposisi atau rasa menu..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              {/* UPLOAD FOTO DARI LAPTOP / KOMPUTER */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                    Foto Produk (Upload dari Laptop)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    {showUrlInput ? '« Gunakan Upload Laptop' : 'Punya URL Gambar?'}
                  </button>
                </div>

                {!showUrlInput ? (
                  <div className="space-y-2">
                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />

                    {/* Interactive Drag & Drop / Click Upload Box */}
                    <div 
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-4 transition cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
                    >
                      {formData.imageUrl ? (
                        <div className="flex items-center gap-4 w-full">
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-md shrink-0"
                          />
                          <div className="flex-1 text-left space-y-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                              <Check className="w-3 h-3 text-emerald-600" /> Foto Berhasil Diupload
                            </span>
                            <p className="text-[11px] text-slate-500 line-clamp-1 font-mono">
                              {formData.imageUrl.startsWith('data:') ? 'File Foto dari Laptop' : formData.imageUrl}
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current && fileInputRef.current.click();
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition"
                              >
                                Ganti Foto Laptop
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, imageUrl: '' }));
                                }}
                                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[10px] font-bold transition"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center mx-auto transition">
                            <Upload className="w-6 h-6 stroke-[2.5]" />
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-800">
                              Klik untuk Pilih Gambar dari Laptop / Komputer
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Format PNG, JPG, WEBP (Ukuran maks. 8 MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Masukkan URL foto online (https://...)"
                      value={formData.imageUrl}
                      onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Status Ready Switch Card */}
              <div 
                onClick={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer"
              >
                <div>
                  <p className="font-extrabold text-xs text-slate-800">Status Stok Produk</p>
                  <p className="text-[10px] text-slate-500">
                    {formData.isAvailable ? 'Produk aktif dan dapat dipesan pelanggan' : 'Stok habis / sementara disembunyikan'}
                  </p>
                </div>
                <div className={`w-11 h-6 rounded-full p-1 transition-colors ${formData.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setProductModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition active:scale-95 text-xs"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Produk</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl space-y-5 shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-tight leading-tight font-heading">
                    {editingCategory ? 'Edit Data Kategori Menu' : 'Tambah Kategori Menu Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Restoran CaffePOS Multi-Role System</p>
                </div>
              </div>

              <button 
                onClick={() => setCategoryModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 pt-2 space-y-4 text-xs font-medium">
              <div>
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Desserts & Cake"
                  value={catFormData.name}
                  onChange={e => setCatFormData({ ...catFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Kode / Slug URL (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: dessert"
                  value={catFormData.slug}
                  onChange={e => setCatFormData({ ...catFormData, slug: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Urutan Tampil <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={catFormData.displayOrder}
                  onChange={e => setCatFormData({ ...catFormData, displayOrder: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCategoryModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition active:scale-95 text-xs"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
