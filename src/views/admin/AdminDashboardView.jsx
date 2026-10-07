import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, DollarSign, Plus, Edit3, Trash2, 
  CheckCircle, XCircle, TrendingUp, Coffee, FileSpreadsheet, Sparkles, QrCode,
  LayoutDashboard, Layers, Table as TableIcon, Receipt, Users, Menu, Bell, ChevronDown, RefreshCw, Search, LogOut, Clock,
  Upload, Image as ImageIcon, FileUp, Camera, Check, X, Printer, Wallet, CreditCard, ArrowUpRight, Calendar
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { apiService } from '../../services/apiService';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function AdminDashboardView({ 
  products = [], 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductAvailability,
  toggleProductBestSeller,
  orders = [],
  tables = [],
  staffUser,
  onLogoutStaff
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard'); // 'dashboard' | 'products' | 'categories' | 'tables' | 'orders' | 'financial'
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today' | '7days' | 'month' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);

  // Orders / Riwayat Transaksi Filter States
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);

  // Multi-Tenant Caffe Stores State
  const [storesList, setStoresList] = useState([
    { id: 'store-01', name: 'CaffePOS Resto (Pusat)', code: 'PUSAT', address: 'Jl. Malioboro No. 12' },
    { id: 'store-02', name: 'CaffePOS Cabang Dago', code: 'DAGO', address: 'Jl. Ir. H. Juanda No. 88' }
  ]);
  const [selectedStoreId, setSelectedStoreId] = useState('store-01');
  const currentStore = storesList.find(s => s.id === selectedStoreId) || storesList[0];

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

  // Tables State
  const [tablesList, setTablesList] = useState(tables && tables.length > 0 ? tables : [
    { id: 'tbl-1', number: 'M-01', token: 'QR-CAFFE-M01', status: 'available', capacity: 2 },
    { id: 'tbl-2', number: 'M-02', token: 'QR-CAFFE-M02', status: 'occupied', capacity: 4 },
    { id: 'tbl-3', number: 'M-03', token: 'QR-CAFFE-M03', status: 'available', capacity: 4 },
    { id: 'tbl-4', number: 'M-04', token: 'QR-CAFFE-M04', status: 'available', capacity: 6 },
    { id: 'tbl-5', number: 'M-05', token: 'QR-CAFFE-M05', status: 'available', capacity: 2 },
    { id: 'tbl-6', number: 'M-06', token: 'QR-CAFFE-M06', status: 'occupied', capacity: 4 }
  ]);

  useEffect(() => {
    const fetchTbls = async () => {
      const fetched = await apiService.getTables();
      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        setTablesList(fetched);
      }
    };
    fetchTbls();
  }, []);

  // Table Add/Edit Modal State
  const [tableModal, setTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tblFormData, setTblFormData] = useState({
    number: '',
    capacity: '4',
    status: 'available'
  });

  // QR Code Print Modal State
  const [qrModal, setQrModal] = useState(false);
  const [selectedQrTable, setSelectedQrTable] = useState(null);

  const openAddTableModal = () => {
    setEditingTable(null);
    const nextNum = (tablesList.length + 1).toString().padStart(2, '0');
    setTblFormData({
      number: `M-${nextNum}`,
      capacity: '4',
      status: 'available'
    });
    setTableModal(true);
  };

  const openEditTableModal = (tbl) => {
    setEditingTable(tbl);
    setTblFormData({
      number: tbl.number,
      capacity: tbl.capacity ? tbl.capacity.toString() : '4',
      status: tbl.status || 'available'
    });
    setTableModal(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    const rawNum = tblFormData.number.trim();
    const cleanNum = rawNum.startsWith('M-') ? rawNum : `M-${rawNum.padStart(2, '0')}`;
    const capNum = parseInt(tblFormData.capacity) || 4;
    const qrToken = `QR-CAFFE-${cleanNum.replace('-', '')}`;

    if (editingTable) {
      const updatedTbl = {
        number: cleanNum,
        token: qrToken,
        capacity: capNum,
        status: tblFormData.status
      };
      setTablesList(prev => prev.map(t => t.id === editingTable.id ? { ...t, ...updatedTbl } : t));
      await apiService.updateTable(editingTable.id, updatedTbl);
    } else {
      const newTbl = {
        id: 'tbl-' + Date.now(),
        number: cleanNum,
        token: qrToken,
        capacity: capNum,
        status: tblFormData.status
      };
      setTablesList(prev => [...prev, newTbl]);
      await apiService.createTable(newTbl);
    }
    setTableModal(false);
  };

  const handleDeleteTable = async (tblId) => {
    if (window.confirm('Yakin ingin menghapus meja ini dari sistem?')) {
      setTablesList(prev => prev.filter(t => t.id !== tblId));
      await apiService.deleteTable(tblId);
    }
  };

  const openQrModal = (tbl) => {
    setSelectedQrTable(tbl);
    setQrModal(true);
  };

  const handlePrintQrCode = () => {
    window.print();
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
    isAvailable: true,
    isBestSeller: false
  });

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Ukuran file foto terlalu besar (Maksimal 15 MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, imageUrl: compressedDataUrl }));
      };
      img.src = event.target.result;
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
      isAvailable: true,
      isBestSeller: false
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
      isAvailable: prod.isAvailable,
      isBestSeller: Boolean(prod.isBestSeller)
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
        isAvailable: formData.isAvailable,
        isBestSeller: formData.isBestSeller
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
        isBestSeller: formData.isBestSeller,
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

          {/* Logged-in Staff User & Outlet Info */}
          <div className="p-3">
            <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700/60 shadow-inner flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-extrabold text-xs text-white truncate">{staffUser?.storeName || 'CaffePOS Resto'}</h2>
                <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-600 text-white mt-0.5">
                  OUTLET: {staffUser?.storeCode || 'PUSAT'}
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
                onClick={() => setActiveMenu('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeMenu === 'dashboard'
                    ? 'bg-blue-600 text-white font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard & Rekap</span>
              </button>

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
                        <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">BEST SELLER</th>
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

                            <td className="py-2 px-3 text-center border border-slate-200">
                              <button
                                onClick={() => toggleProductBestSeller && toggleProductBestSeller(prod.id)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 mx-auto ${
                                  prod.isBestSeller
                                    ? 'bg-amber-100 text-amber-800 border border-amber-400 font-black'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 hover:text-slate-700'
                                }`}
                                title="Klik untuk ubah status Best Seller"
                              >
                                <span>🔥</span>
                                <span>{prod.isBestSeller ? 'Best Seller' : 'Reguler'}</span>
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

          {/* SECTION: KELOLA MEJA & KODE QR */}
          {activeMenu === 'tables' && (
            <div className="space-y-6">
              
              {/* Title Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-heading tracking-tight">
                    <TableIcon className="w-5 h-5 text-blue-600" />
                    Kelola Meja & Kode QR Pelanggan
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Total <strong className="text-slate-800">{tablesList.length}</strong> meja terdaftar di restoran untuk pemesanan QR Self-Service.
                  </p>
                </div>

                <button
                  onClick={openAddTableModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Tambah Meja Baru</span>
                </button>
              </div>

              {/* Table Data View (table-bordered / table-sm / btn-sm) */}
              <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10 border border-slate-300 bg-slate-100">NO</th>
                        <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">NOMOR MEJA</th>
                        <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">KODE QR TOKEN</th>
                        <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">KAPASITAS</th>
                        <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">STATUS MEJA</th>
                        <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">CETAK KODE QR</th>
                        <th className="py-2.5 px-3 text-center w-20 border border-slate-300 bg-slate-100">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablesList.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-slate-400 italic text-xs border border-slate-200">
                            Belum ada meja terdaftar.
                          </td>
                        </tr>
                      ) : (
                        tablesList.map((tbl, idx) => (
                          <tr key={tbl.id || idx} className="hover:bg-blue-50/40 transition odd:bg-white even:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500 text-[11px] border border-slate-200">{idx + 1}</td>
                            
                            <td className="py-2.5 px-3 font-extrabold text-slate-900 border border-slate-200 text-xs">
                              Meja {tbl.number}
                            </td>

                            <td className="py-2.5 px-3 font-mono text-xs border border-slate-200">
                              <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded font-bold">
                                {tbl.token}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center font-bold text-slate-700 text-xs border border-slate-200">
                              {tbl.capacity} Kursi
                            </td>

                            <td className="py-2.5 px-3 text-center border border-slate-200">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                tbl.status === 'available'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300/80'
                                  : 'bg-amber-50 text-amber-700 border border-amber-300/80'
                              }`}>
                                {tbl.status === 'available' ? 'Kosong' : 'Terisi'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center border border-slate-200">
                              <button
                                onClick={() => openQrModal(tbl)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold shadow-2xs transition inline-flex items-center gap-1.5 active:scale-95"
                              >
                                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                                <span>Cetak Kode QR</span>
                              </button>
                            </td>

                            <td className="py-2.5 px-3 text-center border border-slate-200">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openEditTableModal(tbl)}
                                  className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs transition"
                                  title="Edit Meja"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteTable(tbl.id)}
                                  className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-2xs transition"
                                  title="Hapus Meja"
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

          {/* SECTION: RIWAYAT TRANSAKSI PENJUALAN */}
          {activeMenu === 'orders' && (() => {
            // Filter orders
            const filteredOrders = orders.filter(ord => {
              // Search query filter
              const matchesSearch = 
                (ord.orderNumber || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                (ord.customerName || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                (ord.tableNumber || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                (ord.id || '').toLowerCase().includes(orderSearchQuery.toLowerCase());

              // Order Status filter
              const matchesStatus = orderStatusFilter === 'all' || ord.status === orderStatusFilter;

              // Payment Status filter
              const matchesPayment = orderPaymentFilter === 'all' || ord.paymentStatus === orderPaymentFilter;

              // Period filter
              let matchesPeriod = true;
              if (periodFilter !== 'all' && ord.createdAt) {
                const orderDate = new Date(ord.createdAt);
                const now = new Date();
                if (periodFilter === 'today') {
                  matchesPeriod = orderDate.toDateString() === now.toDateString();
                } else if (periodFilter === '7days') {
                  const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
                  matchesPeriod = diffDays <= 7;
                } else if (periodFilter === 'month') {
                  matchesPeriod = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
                }
              }

              return matchesSearch && matchesStatus && matchesPayment && matchesPeriod;
            });

            // Summary stats for filtered orders
            const totalOrdersCount = filteredOrders.length;
            const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'paid' || o.status === 'completed');
            const unpaidOrders = filteredOrders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'completed');
            const totalRevenue = paidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const totalUnpaid = unpaidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

            return (
              <div className="space-y-6">
                
                {/* Title Card */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-heading tracking-tight">
                      <Receipt className="w-5 h-5 text-blue-600" />
                      Riwayat Transaksi & Order History
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Total <strong className="text-slate-800">{orders.length}</strong> seluruh transaksi masuk di sistem CaffePOS.
                    </p>
                  </div>

                  {/* Period Filter Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    {[
                      { id: 'today', label: 'Hari Ini' },
                      { id: '7days', label: '7 Hari' },
                      { id: 'month', label: 'Bulan Ini' },
                      { id: 'all', label: 'Semua' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setPeriodFilter(btn.id)}
                        className={`px-3 py-1.5 rounded-lg transition text-xs font-bold ${
                          periodFilter === btn.id
                            ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Quick Stat Badges */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Transaksi</span>
                    <h3 className="text-xl font-black text-slate-900 font-mono">{totalOrdersCount}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sesuai filter aktif</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-emerald-600 block mb-1">Total Pendapatan Lunas</span>
                    <h3 className="text-xl font-black text-emerald-700 font-mono">{formatRupiah(totalRevenue)}</h3>
                    <p className="text-[10px] text-emerald-600/70 mt-0.5">{paidOrders.length} transaksi selesai</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-amber-600 block mb-1">Menunggu Pembayaran</span>
                    <h3 className="text-xl font-black text-amber-700 font-mono">{unpaidOrders.length}</h3>
                    <p className="text-[10px] text-amber-600/70 mt-0.5">Senilai {formatRupiah(totalUnpaid)}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-blue-600 block mb-1">Rata-Rata Transaksi</span>
                    <h3 className="text-xl font-black text-blue-700 font-mono">
                      {paidOrders.length > 0 ? formatRupiah(Math.round(totalRevenue / paidOrders.length)) : 'Rp 0'}
                    </h3>
                    <p className="text-[10px] text-blue-600/70 mt-0.5">AOV per nota lunas</p>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
                  {/* Search */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari No. Invoice / Pelanggan / Meja..."
                      value={orderSearchQuery}
                      onChange={e => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    />
                  </div>

                  {/* Status & Payment Filters */}
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <select
                      value={orderStatusFilter}
                      onChange={e => setOrderStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="all">Semua Status Dapur</option>
                      <option value="pending_payment">Menunggu Bayar</option>
                      <option value="preparing">Sedang Dibuat (Dapur)</option>
                      <option value="ready">Siap Disajikan</option>
                      <option value="completed">Selesai</option>
                    </select>

                    <select
                      value={orderPaymentFilter}
                      onChange={e => setOrderPaymentFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="all">Semua Pembayaran</option>
                      <option value="paid">Lunas (Paid)</option>
                      <option value="unpaid">Belum Bayar (Unpaid)</option>
                    </select>

                    {(orderSearchQuery || orderStatusFilter !== 'all' || orderPaymentFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setOrderSearchQuery('');
                          setOrderStatusFilter('all');
                          setOrderPaymentFilter('all');
                        }}
                        className="text-xs text-blue-600 hover:underline font-bold whitespace-nowrap px-1"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders Data Table */}
                <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-300">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-10 border border-slate-300 bg-slate-100">NO</th>
                          <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">NO. INVOICE / ID</th>
                          <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">WAKTU & TANGGAL</th>
                          <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">PELANGGAN / MEJA</th>
                          <th className="py-2.5 px-3 border border-slate-300 bg-slate-100">ITEM PESANAN</th>
                          <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">STATUS BAYAR</th>
                          <th className="py-2.5 px-3 text-center border border-slate-300 bg-slate-100">STATUS DAPUR</th>
                          <th className="py-2.5 px-3 text-right border border-slate-300 bg-slate-100">TOTAL TAGIHAN</th>
                          <th className="py-2.5 px-3 text-center w-28 border border-slate-300 bg-slate-100">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="py-12 text-center text-slate-400 italic text-xs border border-slate-200">
                              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                              Tidak ada riwayat transaksi yang cocok dengan filter.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((ord, idx) => {
                            const isPaid = ord.paymentStatus === 'paid' || ord.status === 'completed';
                            return (
                              <tr key={ord.id || idx} className="hover:bg-blue-50/40 transition odd:bg-white even:bg-slate-50/50">
                                <td className="py-2.5 px-3 text-center font-bold text-slate-500 text-[11px] border border-slate-200">
                                  {idx + 1}
                                </td>

                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border border-slate-200 text-xs">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-blue-700">{ord.orderNumber || ord.id}</span>
                                    <span className="text-[10px] text-slate-400 font-sans">{ord.orderType === 'takeaway' ? '🥡 Bungkus / Takeaway' : '🍽️ Dine-In'}</span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 border border-slate-200 text-[11px] text-slate-600 font-medium whitespace-nowrap">
                                  {ord.createdAt ? formatDateTime(ord.createdAt) : '-'}
                                </td>

                                <td className="py-2.5 px-3 border border-slate-200">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-slate-900 text-xs">{ord.customerName || 'Guest'}</span>
                                    <span className="text-[10px] text-amber-800 font-bold">
                                      Meja {ord.tableNumber || '-'}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 border border-slate-200 max-w-xs">
                                  <div className="space-y-0.5">
                                    {(ord.items || []).map((item, iIdx) => (
                                      <div key={iIdx} className="text-[11px] text-slate-800 leading-tight">
                                        <span className="font-bold text-slate-900">{item.quantity}x</span> {item.productName}
                                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                                          <span className="text-[9.5px] text-slate-500 block font-normal">
                                            ({item.selectedVariants.join(', ')})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-center border border-slate-200">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                      isPaid
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                        : 'bg-rose-50 text-rose-700 border border-rose-300'
                                    }`}>
                                      {isPaid ? '✓ Lunas' : 'Belum Bayar'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 uppercase font-mono">
                                      {ord.paymentMethod || 'cash'}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-center border border-slate-200">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    ord.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ord.status === 'ready'
                                      ? 'bg-purple-100 text-purple-800'
                                      : ord.status === 'preparing'
                                      ? 'bg-blue-100 text-blue-800 animate-pulse'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {ord.status === 'completed' ? 'Selesai' :
                                     ord.status === 'ready' ? 'Siap Saji' :
                                     ord.status === 'preparing' ? 'Dapur' : 'Pending'}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-xs border border-slate-200">
                                  {formatRupiah(ord.total || 0)}
                                </td>

                                <td className="py-2.5 px-3 text-center border border-slate-200">
                                  <button
                                    onClick={() => setSelectedOrderForReceipt(ord)}
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold shadow-2xs transition inline-flex items-center gap-1 active:scale-95"
                                  >
                                    <Printer className="w-3 h-3 text-amber-400" />
                                    <span>Struk</span>
                                  </button>
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
            );
          })()}

          {/* SECTION 0 & 5: DASHBOARD OVERVIEW & REKAPAN PENJUALAN + GRAFIK */}
          {(activeMenu === 'dashboard' || activeMenu === 'financial') && (() => {
            // Filter orders by period
            const filteredOrdersByPeriod = orders.filter(o => {
              if (periodFilter === 'all') return true;
              const orderDate = new Date(o.createdAt);
              const now = new Date();
              if (periodFilter === 'today') {
                return orderDate.toDateString() === now.toDateString();
              }
              if (periodFilter === '7days') {
                const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
                return diffDays <= 7;
              }
              if (periodFilter === 'month') {
                return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
              }
              return true;
            });

            // Financial Calculations
            const paidOrders = filteredOrdersByPeriod.filter(o => o.paymentStatus === 'paid' || o.status === 'completed');
            const pendingOrders = filteredOrdersByPeriod.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'completed');
            const periodRevenue = paidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const periodSubtotal = paidOrders.reduce((sum, o) => sum + (parseFloat(o.subtotal) || 0), 0);
            const periodTax = paidOrders.reduce((sum, o) => sum + (parseFloat(o.tax) || 0), 0);
            const periodOrdersCount = filteredOrdersByPeriod.length;
            const periodPaidCount = paidOrders.length;
            const periodAov = periodPaidCount > 0 ? Math.round(periodRevenue / periodPaidCount) : 0;

            // Payment Breakdown
            const cashOrders = paidOrders.filter(o => (o.paymentMethod || '').toLowerCase() === 'cash');
            const qrisOrders = paidOrders.filter(o => (o.paymentMethod || '').toLowerCase() === 'qris');
            const cashAmount = cashOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const qrisAmount = qrisOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const cashPercentage = periodRevenue > 0 ? Math.round((cashAmount / periodRevenue) * 100) : 0;
            const qrisPercentage = periodRevenue > 0 ? Math.round((qrisAmount / periodRevenue) * 100) : 0;

            // Top Products Calculation
            const periodProductSales = {};
            paidOrders.forEach(o => {
              (o.items || []).forEach(item => {
                const name = item.productName || 'Menu';
                if (!periodProductSales[name]) {
                  periodProductSales[name] = {
                    name,
                    qty: 0,
                    revenue: 0,
                    imageUrl: products.find(p => p.name === name)?.imageUrl
                  };
                }
                periodProductSales[name].qty += (item.quantity || 1);
                periodProductSales[name].revenue += (item.subtotal || (item.unitPrice * (item.quantity || 1)) || 0);
              });
            });
            const topProductsList = Object.values(periodProductSales)
              .sort((a, b) => b.qty - a.qty)
              .slice(0, 5);
            const maxProductQty = topProductsList.length > 0 ? Math.max(...topProductsList.map(p => p.qty), 1) : 1;

            // 7-Day Chart Data
            const last7DaysData = Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dateStr = d.toISOString().split('T')[0];
              const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
              const dayOrders = orders.filter(o => {
                const isPaid = o.paymentStatus === 'paid' || o.status === 'completed';
                return isPaid && (o.createdAt || '').startsWith(dateStr);
              });
              const dayRevenue = dayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
              const dayCount = dayOrders.length;
              return { date: dateStr, label: dayLabel, revenue: dayRevenue, count: dayCount };
            });
            const maxDailyRevenue = Math.max(...last7DaysData.map(d => d.revenue), 100000);

            // Table occupancy
            const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;

            return (
              <div className="space-y-6 animate-fade-in">
                
                {/* Top Title & Period Filter Card */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-heading tracking-tight">
                      <LayoutDashboard className="w-5 h-5 text-blue-600" />
                      Dashboard & Rekapan Penjualan
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Ringkasan pendapatan kasir, grafik tren omzet, dan menu terlaris restoran.
                    </p>
                  </div>

                  {/* Filter Period Pills & Print Button */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1 font-bold">
                      <button
                        onClick={() => setPeriodFilter('today')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          periodFilter === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Hari Ini
                      </button>
                      <button
                        onClick={() => setPeriodFilter('7days')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          periodFilter === '7days' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        7 Hari
                      </button>
                      <button
                        onClick={() => setPeriodFilter('month')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          periodFilter === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bulan Ini
                      </button>
                      <button
                        onClick={() => setPeriodFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          periodFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua
                      </button>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95"
                      title="Cetak Rekapan Laporan"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Rekap</span>
                    </button>
                  </div>
                </div>

                {/* 4 TOP KEY METRIC STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Omzet */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Pendapatan</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                        {formatRupiah(periodRevenue)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {periodPaidCount} Transaksi Lunas
                        </span>
                        <span className="text-slate-400 font-medium">Net: {formatRupiah(periodSubtotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Total Transaksi */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Volume Transaksi</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Receipt className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                        {periodOrdersCount} <span className="text-xs font-bold text-slate-500 font-sans">Pesanan</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {periodPaidCount} Selesai
                        </span>
                        {pendingOrders.length > 0 && (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {pendingOrders.length} Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Rata-rata per Pesanan (AOV) */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Rata-rata Nota (AOV)</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                        {formatRupiah(periodAov)}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                        Rata-rata pengeluaran per meja/pelanggan
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Okupansi Meja */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Okupansi Meja</span>
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <TableIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                        {occupiedTablesCount} / {tables.length} <span className="text-xs font-bold text-slate-500 font-sans">Meja</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                        <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {tables.length > 0 ? Math.round((occupiedTablesCount / tables.length) * 100) : 0}% Terisi
                        </span>
                        <span className="text-slate-400 font-medium">{tables.length - occupiedTablesCount} Meja Kosong</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VISUAL CHARTS ROW: GRAFIK TREN PENJUALAN & METODE PEMBAYARAN */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* CHART 1: GRAFIK BATANG TREN 7 HARI TERAKHIR (COL-SPAN 2) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 font-heading">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          Grafik Tren Omzet Penjualan (7 Hari Terakhir)
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          Visualisasi omzet harian berdasarkan transaksi lunas
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                        Realtime Sync
                      </span>
                    </div>

                    {/* SVG Interactive Bar Chart */}
                    <div className="pt-2">
                      <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 pb-6 border-b border-slate-200 relative">
                        {/* Dotted Grid Lines */}
                        <div className="absolute inset-x-0 top-0 border-b border-slate-100 border-dashed" />
                        <div className="absolute inset-x-0 top-1/2 border-b border-slate-100 border-dashed" />
                        
                        {last7DaysData.map((d, idx) => {
                          const heightPct = Math.max(8, Math.round((d.revenue / maxDailyRevenue) * 100));
                          const isHighest = d.revenue === maxDailyRevenue && d.revenue > 0;
                          
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                              {/* Hover Value Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-lg pointer-events-none shadow-lg whitespace-nowrap z-20">
                                {formatRupiah(d.revenue)} ({d.count} trx)
                              </div>

                              {/* Bar Column */}
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full max-w-[42px] rounded-t-xl transition-all duration-500 group-hover:scale-y-105 ${
                                  isHighest
                                    ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/30'
                                    : d.revenue > 0
                                    ? 'bg-gradient-to-t from-slate-700 to-blue-500 opacity-90 group-hover:opacity-100'
                                    : 'bg-slate-100'
                                }`}
                              />

                              {/* Label Day Name */}
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight absolute -bottom-5">
                                {d.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chart Legend Footer */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-6 px-1">
                        <span className="font-medium">Total 7 Hari: <strong className="text-slate-900 font-mono font-bold">{formatRupiah(last7DaysData.reduce((s, d) => s + d.revenue, 0))}</strong></span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Omzet Tertinggi</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" /> Omzet Harian</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CHART 2: KOMPOSISI METODE PEMBAYARAN */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-slate-100 pb-3">
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 font-heading">
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          Metode Pembayaran
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          Distribusi QRIS vs Tunai Kasir
                        </p>
                      </div>

                      {/* Distribution Bars */}
                      <div className="space-y-4 pt-4 text-xs font-medium">
                        {/* QRIS / E-Wallet Card */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <QrCode className="w-3.5 h-3.5 text-blue-600" /> QRIS / Digital
                            </span>
                            <span className="font-mono font-bold text-blue-700">{qrisPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div style={{ width: `${qrisPercentage}%` }} className="h-full bg-blue-600 rounded-full transition-all duration-700" />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>{qrisOrders.length} transaksi</span>
                            <span className="font-bold text-slate-800">{formatRupiah(qrisAmount)}</span>
                          </div>
                        </div>

                        {/* Tunai / Cash Card */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Tunai di Kasir
                            </span>
                            <span className="font-mono font-bold text-emerald-700">{cashPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div style={{ width: `${cashPercentage}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-700" />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>{cashOrders.length} transaksi</span>
                            <span className="font-bold text-slate-800">{formatRupiah(cashAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
                      <span>Pajak Restoran Terkumpul:</span>
                      <strong className="font-mono text-slate-900 font-bold">{formatRupiah(periodTax)}</strong>
                    </div>
                  </div>

                </div>

                {/* BOTTOM ROW: TOP 5 MENU TERLARIS & REKAPAN TRANSAKSI TERAKHIR */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* TOP 5 BEST SELLER MENU */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 font-heading">
                          <Coffee className="w-4 h-4 text-amber-600" />
                          Top 5 Menu Terlaris
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          Berdasarkan kuantitas menu yang terjual
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      {topProductsList.length === 0 ? (
                        <p className="text-slate-400 italic text-center py-6 text-xs">Belum ada data penjualan pada periode ini.</p>
                      ) : (
                        topProductsList.map((prod, idx) => {
                          const progressWidth = Math.round((prod.qty / maxProductQty) * 100);
                          return (
                            <div key={idx} className="space-y-1.5 p-2 rounded-xl hover:bg-slate-50 transition border border-slate-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                                    idx === 0 ? 'bg-amber-500 text-white' :
                                    idx === 1 ? 'bg-slate-400 text-white' :
                                    idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-slate-800 truncate">{prod.name}</span>
                                </div>
                                <span className="font-mono font-extrabold text-slate-900 shrink-0">{prod.qty}x terjual</span>
                              </div>

                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div style={{ width: `${progressWidth}%` }} className="h-full bg-amber-500 rounded-full transition-all duration-500" />
                              </div>

                              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>Omzet:</span>
                                <span className="font-bold text-slate-700">{formatRupiah(prod.revenue)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* REKAPAN TRANSAKSI TERBARU (COL-SPAN 2) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 font-heading">
                            <Receipt className="w-4 h-4 text-blue-600" />
                            Rekap Transaksi Terbaru
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            Histori live pesanan dan pembayaran kasir
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveMenu('orders')}
                          className="text-blue-600 hover:text-blue-700 font-bold text-xs hover:underline"
                        >
                          Lihat Semua &rarr;
                        </button>
                      </div>

                      {/* Compact Table */}
                      <div className="overflow-x-auto pt-2">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-2.5">NOTA</th>
                              <th className="py-2 px-2.5">MEJA</th>
                              <th className="py-2 px-2.5">PELANGGAN</th>
                              <th className="py-2 px-2.5">METODE</th>
                              <th className="py-2 px-2.5">TOTAL</th>
                              <th className="py-2 px-2.5 text-center">STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrdersByPeriod.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="py-8 text-center text-slate-400 italic text-xs">
                                  Belum ada transaksi pada periode ini.
                                </td>
                              </tr>
                            ) : (
                              filteredOrdersByPeriod.slice(0, 5).map((ord) => (
                                <tr key={ord.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                                  <td className="py-2.5 px-2.5 font-mono font-bold text-blue-600 text-[11px]">{ord.orderNumber}</td>
                                  <td className="py-2.5 px-2.5 font-bold text-slate-800 text-xs">Meja {ord.tableNumber}</td>
                                  <td className="py-2.5 px-2.5 text-slate-700 text-xs truncate max-w-[120px]">{ord.customerName}</td>
                                  <td className="py-2.5 px-2.5 uppercase font-mono text-[10px] font-bold text-slate-600">{ord.paymentMethod || 'cash'}</td>
                                  <td className="py-2.5 px-2.5 font-mono font-extrabold text-slate-900 text-xs">{formatRupiah(ord.total)}</td>
                                  <td className="py-2.5 px-2.5 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold ${
                                      ord.paymentStatus === 'paid'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300/80'
                                        : 'bg-amber-50 text-amber-700 border border-amber-300/80'
                                    }`}>
                                      {ord.paymentStatus === 'paid' ? 'LUNAS' : 'PENDING'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
                      <span>Total Transaksi Periode Ini: <strong className="text-slate-900 font-bold font-mono">{filteredOrdersByPeriod.length}</strong></span>
                      <span>Total Omzet: <strong className="text-blue-700 font-bold font-mono">{formatRupiah(periodRevenue)}</strong></span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

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

              {/* Best Seller Switch Card */}
              <div 
                onClick={() => setFormData(prev => ({ ...prev, isBestSeller: !prev.isBestSeller }))}
                className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                  formData.isBestSeller 
                    ? 'bg-amber-50 border-amber-300 text-amber-900' 
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div>
                  <p className="font-extrabold text-xs flex items-center gap-1.5">
                    <span className="text-amber-600">🔥</span> Label Menu Best Seller
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formData.isBestSeller ? 'Menu ini ditandai sebagai Best Seller di katalog' : 'Menu reguler biasa (tanpa badge Best Seller)'}
                  </p>
                </div>
                <div className={`w-11 h-6 rounded-full p-1 transition-colors ${formData.isBestSeller ? 'bg-amber-500' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.isBestSeller ? 'translate-x-5' : 'translate-x-0'}`} />
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

      {/* ADD / EDIT TABLE MODAL */}
      {tableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl space-y-5 shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-tight leading-tight font-heading">
                    {editingTable ? 'Edit Data Meja Restoran' : 'Tambah Meja Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Restoran CaffePOS Multi-Role System</p>
                </div>
              </div>

              <button 
                onClick={() => setTableModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="p-6 pt-2 space-y-4 text-xs font-medium">
              <div>
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Nomor / Label Meja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: M-07 atau 07"
                  value={tblFormData.number}
                  onChange={e => setTblFormData({ ...tblFormData, number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                    Kapasitas Kursi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="4"
                    value={tblFormData.capacity}
                    onChange={e => setTblFormData({ ...tblFormData, capacity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                    Status Meja
                  </label>
                  <select
                    value={tblFormData.status}
                    onChange={e => setTblFormData({ ...tblFormData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition cursor-pointer"
                  >
                    <option value="available">Kosong (Available)</option>
                    <option value="occupied">Terisi (Occupied)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTableModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition active:scale-95 text-xs"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Meja</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* PRINT QR CODE MODAL */}
      {qrModal && selectedQrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
            
            <button
              onClick={() => setQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Print Container Card */}
            <div id="printable-qr-card" className="space-y-4 p-4 border-2 border-slate-900 rounded-2xl bg-white shadow-inner">
              
              {/* Header Resto Brand */}
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                  P
                </div>
                <h2 className="font-black text-base text-slate-900 uppercase tracking-wider font-heading leading-tight">
                  {currentStore.name}
                </h2>
                <div className="flex items-center justify-center gap-1.5 pt-0.5">
                  <span className="bg-slate-900 text-amber-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                    OUTLET: {currentStore.code}
                  </span>
                </div>
              </div>

              {/* QR Code Graphics Card */}
              <div className="bg-slate-950 p-6 rounded-2xl border-4 border-amber-500 shadow-xl inline-block relative mx-auto my-2">
                <svg viewBox="0 0 100 100" className="w-40 h-40 text-white fill-current">
                  <rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="12" y="12" width="16" height="16" fill="currentColor" />
                  
                  <rect x="65" y="5" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="72" y="12" width="16" height="16" fill="currentColor" />

                  <rect x="5" y="65" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="12" y="72" width="16" height="16" fill="currentColor" />

                  <rect x="42" y="8" width="6" height="6" />
                  <rect x="52" y="16" width="6" height="6" />
                  <rect x="42" y="24" width="6" height="6" />
                  <rect x="8" y="42" width="6" height="6" />
                  <rect x="18" y="48" width="6" height="6" />
                  <rect x="28" y="42" width="6" height="6" />

                  <rect x="42" y="42" width="16" height="16" fill="#3b82f6" rx="3" />
                  <rect x="68" y="42" width="8" height="8" />
                  <rect x="80" y="48" width="8" height="8" />

                  <rect x="42" y="68" width="8" height="8" />
                  <rect x="54" y="78" width="10" height="10" />
                  <rect x="72" y="68" width="20" height="20" rx="3" fill="#f59e0b" />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-slate-900 border-2 border-amber-400 text-amber-400 rounded-full px-2 py-0.5 text-[9px] font-mono font-bold shadow-lg">
                    QR-{currentStore.code}-{selectedQrTable.number.replace('-', '')}
                  </div>
                </div>
              </div>

              {/* Table Number Title Badge & URL */}
              <div className="space-y-1.5">
                <span className="inline-block bg-slate-900 text-white font-black text-xl px-5 py-1.5 rounded-xl uppercase tracking-widest shadow-md">
                  MEJA {selectedQrTable.number}
                </span>
                <p className="text-[9px] text-blue-600 font-mono font-bold">
                  https://caffe.aspartech.com/?store={currentStore.code.toLowerCase()}&table={selectedQrTable.number}
                </p>
                <p className="text-[10px] text-slate-600 font-medium max-w-xs mx-auto leading-snug">
                  Imbas (scan) Kode QR ini untuk membuka menu digital & memesan khusus meja <strong>{selectedQrTable.number}</strong> ({currentStore.name}).
                </p>
              </div>

            </div>

            {/* Modal Print Action Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setQrModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintQrCode}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak QR Code</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RECEIPT MODAL FOR ADMIN */}
      {selectedOrderForReceipt && (
        <ReceiptModal 
          order={selectedOrderForReceipt} 
          onClose={() => setSelectedOrderForReceipt(null)} 
        />
      )}

    </div>
  );
}
