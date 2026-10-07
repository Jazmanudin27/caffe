import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, DollarSign, Plus, Edit3, Trash2, 
  CheckCircle, XCircle, TrendingUp, Coffee, FileSpreadsheet, Sparkles, QrCode,
  LayoutDashboard, Layers, Table as TableIcon, Receipt, Users, Menu, Bell, ChevronDown, RefreshCw, Search, LogOut, Clock,
  Upload, Image as ImageIcon, FileUp, Camera, Check, X, Printer, Wallet, CreditCard, ArrowUpRight, Calendar, Eye,
  Settings, Sliders, Store, Wifi, Percent, CheckCircle2, Shield, Zap, Smile, MoreVertical, Activity
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { apiService } from '../../services/apiService';
import ReceiptModal from '../../components/common/ReceiptModal';

// Helper for input date YYYY-MM-DD
const formatIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  onLogoutStaff,
  appSettings,
  updateAppSettings
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard'); // 'dashboard' | 'products' | 'categories' | 'tables' | 'orders' | 'financial' | 'settings'
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today' | '7days' | 'month' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);

  // System Settings Form State
  const [settingsForm, setSettingsForm] = useState(() => ({
    appName: appSettings?.appName || 'CaffePOS Resto',
    caffeTagline: appSettings?.caffeTagline || 'QR Order & Cashier POS System',
    caffeAddress: appSettings?.caffeAddress || 'Jl. Malioboro No. 12, Yogyakarta',
    caffePhone: appSettings?.caffePhone || '0812-3456-7890',
    wifiName: appSettings?.wifiName || 'Caffe_Guest_5G',
    wifiPassword: appSettings?.wifiPassword || 'kopienakbanget',
    enableTax: appSettings ? appSettings.enableTax !== false : true,
    taxRate: appSettings?.taxRate ?? 10,
    enableServiceCharge: appSettings?.enableServiceCharge || false,
    serviceChargeRate: appSettings?.serviceChargeRate || 5,
    receiptFooterNote: appSettings?.receiptFooterNote || 'Terima kasih atas kunjungan Anda! Silakan berkunjung kembali.',
    autoPrintReceipt: appSettings?.autoPrintReceipt || false,
    currencySymbol: appSettings?.currencySymbol || 'Rp'
  }));

  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const handleSaveSettings = (e) => {
    if (e) e.preventDefault();
    if (updateAppSettings) {
      updateAppSettings(settingsForm);
    }
    setSettingsSavedToast(true);
    setTimeout(() => {
      setSettingsSavedToast(false);
    }, 3000);
  };

  // Orders / Riwayat Transaksi Filter States (Default: 3 hari kebelakang)
  const [orderStartDate, setOrderStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return formatIsoDate(d);
  });
  const [orderEndDate, setOrderEndDate] = useState(() => formatIsoDate(new Date()));
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

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
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveMenu('products')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeMenu === 'products'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/25'
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
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/25'
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
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/25'
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
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/25'
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
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Laporan Keuangan</span>
              </button>
            </div>

            {/* PENGATURAN & SISTEM */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-3 block mb-2">
                PENGATURAN & SISTEM
              </span>

              <button
                onClick={() => setActiveMenu('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeMenu === 'settings'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan Kafe & PPN</span>
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
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs sticky top-0 z-20">
          {/* Left: Sidebar Toggle Button + System Brand Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-black text-slate-900 tracking-wider uppercase text-sm sm:text-base font-heading">
                CAFFE SMART SYSTEM
              </span>
              <span className="text-slate-300 font-light hidden md:inline">|</span>
              <span className="text-slate-500 font-semibold hidden md:inline">
                {appSettings?.appName || 'Department for Integrated Services'}
              </span>
            </div>
          </div>

          {/* Right: User Welcome & Real-time Date/Clock & Notifications */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-700">
            <div className="hidden lg:flex items-center gap-1.5 text-slate-500 text-[11px]">
              <span>WELCOME, <strong className="text-slate-900 font-extrabold">{staffUser ? staffUser.name : 'Sarah J. (Admin)'}</strong></span>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-slate-600">{formattedDateString}</span>
            </div>

            <button className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white font-bold text-[8.5px] rounded-full flex items-center justify-center animate-pulse">
                3
              </span>
            </button>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 p-1 pl-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  {staffUser ? staffUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
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

              // Date Range filter (Dari Tanggal - Sampai Tanggal)
              let matchesDateRange = true;
              if (ord.createdAt) {
                const ordDate = new Date(ord.createdAt);
                const ordDateStr = formatIsoDate(ordDate);
                if (orderStartDate && ordDateStr < orderStartDate) matchesDateRange = false;
                if (orderEndDate && ordDateStr > orderEndDate) matchesDateRange = false;
              }

              return matchesSearch && matchesStatus && matchesPayment && matchesDateRange;
            });

            // Summary stats for filtered orders
            const totalOrdersCount = filteredOrders.length;
            const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'paid' || o.status === 'completed');
            const unpaidOrders = filteredOrders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'completed');
            const totalRevenue = paidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const totalUnpaid = unpaidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

            // Quick date preset handler
            const handleApplyDatePreset = (days) => {
              const now = new Date();
              if (days === 'all') {
                setOrderStartDate('');
                setOrderEndDate('');
              } else if (days === 'month') {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                setOrderStartDate(formatIsoDate(firstDay));
                setOrderEndDate(formatIsoDate(now));
              } else {
                const start = new Date();
                start.setDate(start.getDate() - days);
                setOrderStartDate(formatIsoDate(start));
                setOrderEndDate(formatIsoDate(now));
              }
            };

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

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      onClick={() => handleApplyDatePreset(3)}
                      className={`px-3 py-1.5 rounded-lg transition text-xs font-bold ${
                        orderStartDate && orderEndDate && orderStartDate === formatIsoDate(new Date(Date.now() - 3 * 86400000))
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3 Hari (Default)
                    </button>
                    <button
                      onClick={() => handleApplyDatePreset(7)}
                      className="px-3 py-1.5 rounded-lg transition text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      7 Hari
                    </button>
                    <button
                      onClick={() => handleApplyDatePreset('month')}
                      className="px-3 py-1.5 rounded-lg transition text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Bulan Ini
                    </button>
                    <button
                      onClick={() => handleApplyDatePreset('all')}
                      className={`px-3 py-1.5 rounded-lg transition text-xs font-bold ${
                        !orderStartDate && !orderEndDate
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua
                    </button>
                  </div>
                </div>

                {/* 4 Quick Stat Badges */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Transaksi</span>
                    <h3 className="text-xl font-black text-slate-900 font-mono">{totalOrdersCount}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sesuai rentang tanggal aktif</p>
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

                {/* Search & Date Range Filter Bar */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    
                    {/* Date Range: Dari Tanggal - Sampai Tanggal */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-extrabold text-slate-700 text-[11px]">Dari:</span>
                        <input
                          type="date"
                          value={orderStartDate}
                          onChange={e => setOrderStartDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-700 text-[11px]">Sampai:</span>
                        <input
                          type="date"
                          value={orderEndDate}
                          onChange={e => setOrderEndDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari No. Invoice / Pelanggan / Meja..."
                        value={orderSearchQuery}
                        onChange={e => setOrderSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Status & Payment Filters Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
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
                    </div>

                    {(orderSearchQuery || orderStatusFilter !== 'all' || orderPaymentFilter !== 'all' || !orderStartDate || !orderEndDate) && (
                      <button
                        onClick={() => {
                          setOrderSearchQuery('');
                          setOrderStatusFilter('all');
                          setOrderPaymentFilter('all');
                          handleApplyDatePreset(3);
                        }}
                        className="text-xs text-blue-600 hover:underline font-bold whitespace-nowrap px-1"
                      >
                        Reset Filter (3 Hari)
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
                          <th className="py-2.5 px-3 text-center w-36 border border-slate-300 bg-slate-100">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="py-12 text-center text-slate-400 italic text-xs border border-slate-200">
                              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                              Tidak ada riwayat transaksi yang cocok dengan filter tanggal ({orderStartDate || 'Awal'} s/d {orderEndDate || 'Akhir'}).
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
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* DETAIL BUTTON */}
                                    <button
                                      onClick={() => setSelectedOrderForDetail(ord)}
                                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-extrabold shadow-2xs transition inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                                      title="Lihat Rincian Lengkap Pesanan"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Detail</span>
                                    </button>

                                    {/* CETAK STRUK BUTTON */}
                                    <button
                                      onClick={() => setSelectedOrderForReceipt(ord)}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold shadow-2xs transition inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                                      title="Cetak Struk Pembayaran"
                                    >
                                      <Printer className="w-3 h-3 text-amber-400" />
                                      <span>Cetak</span>
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

            // Table occupancy & unpaid orders
            const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;
            const unpaidOrdersList = orders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'completed');
            const totalUnpaidAmount = unpaidOrdersList.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const occupancyPct = tables.length > 0 ? Math.round((occupiedTablesCount / tables.length) * 100) : 0;

            return (
              <div className="space-y-6 animate-fade-in text-slate-800">
                
                {/* TOP HEADER: DASHBOARD TITLE & PERIOD FILTER BAR */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                      Dashboard
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Ringkasan performa penjualan, analitik pesanan, dan monitoring layanan kafe secara real-time.
                    </p>
                  </div>

                  {/* Filter Period Pills & Print Button */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 font-bold">
                      <button
                        onClick={() => setPeriodFilter('today')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          periodFilter === 'today' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Hari Ini
                      </button>
                      <button
                        onClick={() => setPeriodFilter('7days')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          periodFilter === '7days' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        7 Hari
                      </button>
                      <button
                        onClick={() => setPeriodFilter('month')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          periodFilter === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bulan Ini
                      </button>
                      <button
                        onClick={() => setPeriodFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          periodFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua
                      </button>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 text-xs"
                      title="Cetak Rekapan Laporan"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Rekap</span>
                    </button>
                  </div>
                </div>

                {/* 4 TOP KEY METRIC STAT CARDS (RICH COLORFUL THEMED CARDS ON WHITE BACKGROUND) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* CARD 1: ACTIVE PUBLIC SERVICES / TOTAL PENDAPATAN (VIOLET/INDIGO CARD) */}
                  <div className="bg-gradient-to-br from-[#161233] via-[#24144e] to-[#120a2a] text-white p-5 rounded-2xl border border-indigo-500/40 shadow-lg shadow-indigo-950/15 relative overflow-hidden flex flex-col justify-between group hover:border-indigo-400 transition">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between pb-3 relative z-10">
                      <span className="text-[10.5px] font-extrabold text-indigo-300 uppercase tracking-wider">
                        TOTAL OMZET PENJUALAN
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold border border-indigo-500/30">
                        <Zap className="w-3.5 h-3.5 text-indigo-300" />
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                          {formatRupiah(periodRevenue)}
                        </h3>
                        <span className="text-emerald-400 font-extrabold text-xs font-mono">
                          / +8.1%
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200/70 mt-1 font-medium">
                        {periodPaidCount} Transaksi Lunas Selesai
                      </p>
                    </div>
                  </div>

                  {/* CARD 2: PENDING APPROVALS / PESANAN PERLU TINDAKAN (PURPLE/MAGENTA CARD) */}
                  <div className="bg-gradient-to-br from-[#2a0e36] via-[#3d124e] to-[#1a0822] text-white p-5 rounded-2xl border border-purple-500/40 shadow-lg shadow-purple-950/15 relative overflow-hidden flex flex-col justify-between group hover:border-purple-400 transition">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between pb-3 relative z-10">
                      <span className="text-[10.5px] font-extrabold text-purple-300 uppercase tracking-wider">
                        PENDING TRANSAKSI
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
                        <Clock className="w-3.5 h-3.5 text-purple-300" />
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-purple-100 font-mono tracking-tight">
                          {unpaidOrdersList.length}
                        </h3>
                        <span className="text-rose-400 font-extrabold text-xs font-sans">
                          / Action Req
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-200/70 mt-1 font-medium">
                        Senilai {formatRupiah(totalUnpaidAmount)} belum lunas
                      </p>
                    </div>
                  </div>

                  {/* CARD 3: CITIZEN SATISFACTION / OKUPANSI MEJA & KEPUASAN (TEAL/EMERALD CARD) */}
                  <div className="bg-gradient-to-br from-[#052926] via-[#093d39] to-[#041a18] text-white p-5 rounded-2xl border border-teal-500/40 shadow-lg shadow-teal-950/15 relative overflow-hidden flex flex-col justify-between group hover:border-teal-400 transition">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between pb-3 relative z-10">
                      <span className="text-[10.5px] font-extrabold text-teal-300 uppercase tracking-wider">
                        OKUPANSI MEJA RESTO
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-500/30">
                        <Smile className="w-3.5 h-3.5 text-teal-300" />
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-teal-100 font-mono tracking-tight">
                          {occupancyPct}%
                        </h3>
                        <span className="text-teal-400 font-extrabold text-xs">
                          | Sangat Baik
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-200/70 mt-1 font-medium">
                        {occupiedTablesCount} dari {tables.length} meja terisi
                      </p>
                    </div>
                  </div>

                  {/* CARD 4: RESOLVED REQUESTS / PESANAN SELESAI (CYAN/BLUE CARD) */}
                  <div className="bg-gradient-to-br from-[#09294d] via-[#123d6e] to-[#071c36] text-white p-5 rounded-2xl border border-blue-500/40 shadow-lg shadow-blue-950/15 relative overflow-hidden flex flex-col justify-between group hover:border-blue-400 transition">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between pb-3 relative z-10">
                      <span className="text-[10.5px] font-extrabold text-cyan-300 uppercase tracking-wider">
                        PESANAN SELESAI
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-cyan-300 flex items-center justify-center font-bold border border-blue-500/30">
                        <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300" />
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-cyan-100 font-mono tracking-tight">
                          {periodPaidCount}
                        </h3>
                        <span className="text-cyan-400 font-extrabold text-xs font-mono">
                          / +14.2%
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-200/70 mt-1 font-medium">
                        AOV: {formatRupiah(periodAov)} per nota
                      </p>
                    </div>
                  </div>

                </div>

                {/* MIDDLE ROW: ANALITIK PENJUALAN (MULTI-LINE CURVE CHART) & DISTRIBUSI KATEGORI (DONUT PIE CHART) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* CHART 1: PUBLIC SERVICE ANALYTICS / ANALITIK TREN MULTI-LINE SVG (COL-SPAN 2) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 tracking-tight font-heading">
                          Analitik Penjualan & Performa Layanan
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Tren Omzet Penjualan vs Volume Pesanan Terselesaikan
                        </p>
                      </div>

                      {/* Legend & Dropdown filter */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <span className="w-3 h-0.5 bg-indigo-600 rounded-full" /> Omzet (Rp)
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <span className="w-3 h-0.5 bg-cyan-500 rounded-full" /> Pesanan
                          </span>
                        </div>

                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer">
                          <option>Semua Layanan (Okt - Des)</option>
                          <option>Dine-In Saja</option>
                          <option>Takeaway Saja</option>
                        </select>
                      </div>
                    </div>

                    {/* SVG Multi-Line Chart Canvas */}
                    <div className="relative pt-2">
                      <div className="h-60 w-full relative">
                        {/* SVG Visual Graph */}
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 650 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid horizontal lines */}
                          <line x1="40" y1="10" x2="640" y2="10" stroke="#f1f5f9" strokeDasharray="3 3" />
                          <line x1="40" y1="50" x2="640" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                          <line x1="40" y1="90" x2="640" y2="90" stroke="#f1f5f9" strokeDasharray="3 3" />
                          <line x1="40" y1="130" x2="640" y2="130" stroke="#f1f5f9" strokeDasharray="3 3" />
                          <line x1="40" y1="170" x2="640" y2="170" stroke="#e2e8f0" />

                          {/* Y-Axis text labels */}
                          <text x="10" y="14" fill="#94a3b8" fontSize="10" fontWeight="bold">100</text>
                          <text x="15" y="54" fill="#94a3b8" fontSize="10" fontWeight="bold">75</text>
                          <text x="15" y="94" fill="#94a3b8" fontSize="10" fontWeight="bold">50</text>
                          <text x="15" y="134" fill="#94a3b8" fontSize="10" fontWeight="bold">25</text>
                          <text x="20" y="174" fill="#94a3b8" fontSize="10" fontWeight="bold">0</text>

                          {/* Area Fill for Violet Curve */}
                          <path
                            d="M 50 150 C 95 130, 140 145, 185 110 C 230 75, 275 125, 320 100 C 365 75, 410 120, 455 90 C 500 60, 545 80, 590 65 L 635 85 L 635 170 L 50 170 Z"
                            fill="url(#purpleGradient)"
                          />

                          {/* Primary Violet Line (Omzet Trend) */}
                          <path
                            d="M 50 150 C 95 130, 140 145, 185 110 C 230 75, 275 125, 320 100 C 365 75, 410 120, 455 90 C 500 60, 545 80, 590 65 L 635 85"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Secondary Cyan Line (Requests Resolved Trend) */}
                          <path
                            d="M 50 165 C 95 140, 140 160, 185 135 C 230 110, 275 140, 320 120 C 365 100, 410 70, 455 50 C 500 80, 545 95, 590 70 L 635 30"
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Glowing interactive point markers */}
                          <circle cx="185" cy="110" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="320" cy="100" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="455" cy="90" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="590" cy="65" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />

                          <circle cx="455" cy="50" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="635" cy="30" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                        </svg>

                        {/* X-Axis Month Labels */}
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 pl-8 pr-2 pt-2">
                          <span>Jan</span>
                          <span>Feb</span>
                          <span>Mar</span>
                          <span>Apr</span>
                          <span>Mei</span>
                          <span>Jun</span>
                          <span>Jul</span>
                          <span>Agu</span>
                          <span>Sep</span>
                          <span>Okt</span>
                          <span>Nov</span>
                          <span>Des</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CHART 2: SERVICE DISTRIBUTION / DISTRIBUSI KATEGORI PIE/DONUT CHART */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight font-heading">
                            Distribusi Penjualan Kategori
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Porsi pendapatan berdasarkan kategori menu
                          </p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* SVG Donut / Pie Chart Layout */}
                      <div className="py-4 flex flex-col items-center justify-center relative">
                        <div className="relative w-40 h-40">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                            {/* Slice 1: Espresso & Coffee (34%) - Purple/Indigo */}
                            <circle
                              cx="50"
                              cy="50"
                              r="36"
                              fill="transparent"
                              stroke="#818cf8"
                              strokeWidth="24"
                              strokeDasharray="76.9 226"
                              strokeDashoffset="0"
                            />
                            {/* Slice 2: Makanan Berat (21%) - Teal */}
                            <circle
                              cx="50"
                              cy="50"
                              r="36"
                              fill="transparent"
                              stroke="#2dd4bf"
                              strokeWidth="24"
                              strokeDasharray="47.5 226"
                              strokeDashoffset="-76.9"
                            />
                            {/* Slice 3: Snack & Pastry (18%) - Cyan */}
                            <circle
                              cx="50"
                              cy="50"
                              r="36"
                              fill="transparent"
                              stroke="#38bdf8"
                              strokeWidth="24"
                              strokeDasharray="40.7 226"
                              strokeDashoffset="-124.4"
                            />
                            {/* Slice 4: Non-Coffee (15%) - Amber */}
                            <circle
                              cx="50"
                              cy="50"
                              r="36"
                              fill="transparent"
                              stroke="#fbbf24"
                              strokeWidth="24"
                              strokeDasharray="33.9 226"
                              strokeDashoffset="-165.1"
                            />
                            {/* Slice 5: Lainnya (12%) - Pink/Rose */}
                            <circle
                              cx="50"
                              cy="50"
                              r="36"
                              fill="transparent"
                              stroke="#f472b6"
                              strokeWidth="24"
                              strokeDasharray="27.1 226"
                              strokeDashoffset="-199"
                            />
                          </svg>

                          {/* Center Cutout Label */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">TOTAL</span>
                            <span className="text-xs font-black text-slate-900 font-mono">100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Legend Items Breakdown */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> Coffee
                          </span>
                          <span className="font-mono font-extrabold text-indigo-700">34%</span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" /> Food
                          </span>
                          <span className="font-mono font-extrabold text-teal-700">21%</span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Snack
                          </span>
                          <span className="font-mono font-extrabold text-sky-700">18%</span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Non-Coffee
                          </span>
                          <span className="font-mono font-extrabold text-amber-700">15%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        onClick={() => setActiveMenu('products')}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-extrabold hover:underline inline-flex items-center gap-1"
                      >
                        Lihat Rincian Menu Katalog &rarr;
                      </button>
                    </div>
                  </div>

                </div>

                {/* BOTTOM ROW: 3 CARDS (WORKFLOWS, CITIZEN BAR STATISTICS, SERVICE WAIT TIMES) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* CARD 1: DOCUMENT APPROVAL WORKFLOWS / ALUR TRANSAKSI & STATUS ORDER */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight font-heading">
                            Alur Status Transaksi Live
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Monitoring order & proses kasir
                          </p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Orders Workflows Table */}
                      <div className="overflow-x-auto pt-2">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100">
                            <tr>
                              <th className="pb-2">Meja / ID</th>
                              <th className="pb-2">Status</th>
                              <th className="pb-2">Progress</th>
                              <th className="pb-2 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {filteredOrdersByPeriod.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="py-6 text-center text-slate-400 italic">
                                  Belum ada antrean pesanan.
                                </td>
                              </tr>
                            ) : (
                              filteredOrdersByPeriod.slice(0, 4).map((ord, idx) => {
                                const isPaid = ord.paymentStatus === 'paid' || ord.status === 'completed';
                                return (
                                  <tr key={ord.id || idx} className="hover:bg-slate-50/60 transition">
                                    <td className="py-2.5 font-bold text-slate-900">
                                      <span className="block font-black">{ord.tableNumber ? `Meja ${ord.tableNumber}` : 'Takeaway'}</span>
                                      <span className="text-[9.5px] font-mono text-slate-400">{ord.orderNumber}</span>
                                    </td>

                                    <td className="py-2.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase ${
                                        isPaid
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}>
                                        {isPaid ? 'Lunas' : 'Pending'}
                                      </span>
                                    </td>

                                    <td className="py-2.5 w-20">
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          style={{ width: isPaid ? '100%' : '45%' }}
                                          className={`h-full rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                        />
                                      </div>
                                    </td>

                                    <td className="py-2.5 text-right">
                                      <button
                                        onClick={() => setSelectedOrderForDetail(ord)}
                                        className="text-indigo-600 hover:text-indigo-800 font-extrabold text-[10.5px] hover:underline"
                                      >
                                        Detail
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

                    <button
                      onClick={() => setActiveMenu('orders')}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline pt-2 border-t border-slate-100"
                    >
                      Buka Semua Riwayat Order &rarr;
                    </button>
                  </div>

                  {/* CARD 2: CITIZEN STATISTICS / STATISTIK PENJUALAN PER JAM / WAKTU */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight font-heading">
                            Statistik Jam Kunjungan Kafe
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Frekuensi transaksi berdasarkan rentang jam
                          </p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bar chart columns */}
                      <div className="pt-4 space-y-2">
                        <div className="h-36 flex items-end justify-between gap-3 px-2 border-b border-slate-200 pb-2">
                          
                          {/* Time Bucket 1: 08-11 */}
                          <div className="flex-1 flex items-end justify-center gap-1 h-full">
                            <div style={{ height: '45%' }} className="w-2.5 sm:w-3 bg-indigo-500 rounded-t-sm" title="Dine-in: 45%" />
                            <div style={{ height: '30%' }} className="w-2.5 sm:w-3 bg-teal-400 rounded-t-sm" title="Takeaway: 30%" />
                          </div>

                          {/* Time Bucket 2: 12-14 (Peak Lunch) */}
                          <div className="flex-1 flex items-end justify-center gap-1 h-full">
                            <div style={{ height: '85%' }} className="w-2.5 sm:w-3 bg-indigo-600 rounded-t-sm" title="Dine-in: 85%" />
                            <div style={{ height: '95%' }} className="w-2.5 sm:w-3 bg-teal-400 rounded-t-sm" title="Takeaway: 95%" />
                          </div>

                          {/* Time Bucket 3: 15-17 */}
                          <div className="flex-1 flex items-end justify-center gap-1 h-full">
                            <div style={{ height: '60%' }} className="w-2.5 sm:w-3 bg-indigo-500 rounded-t-sm" title="Dine-in: 60%" />
                            <div style={{ height: '50%' }} className="w-2.5 sm:w-3 bg-teal-400 rounded-t-sm" title="Takeaway: 50%" />
                          </div>

                          {/* Time Bucket 4: 18-21 (Peak Dinner) */}
                          <div className="flex-1 flex items-end justify-center gap-1 h-full">
                            <div style={{ height: '90%' }} className="w-2.5 sm:w-3 bg-indigo-600 rounded-t-sm" title="Dine-in: 90%" />
                            <div style={{ height: '75%' }} className="w-2.5 sm:w-3 bg-teal-400 rounded-t-sm" title="Takeaway: 75%" />
                          </div>

                          {/* Time Bucket 5: 22+ */}
                          <div className="flex-1 flex items-end justify-center gap-1 h-full">
                            <div style={{ height: '40%' }} className="w-2.5 sm:w-3 bg-indigo-500 rounded-t-sm" title="Dine-in: 40%" />
                            <div style={{ height: '25%' }} className="w-2.5 sm:w-3 bg-teal-400 rounded-t-sm" title="Takeaway: 25%" />
                          </div>

                        </div>

                        {/* Labels */}
                        <div className="flex justify-between text-[9.5px] font-bold text-slate-500 px-1">
                          <span>08-11</span>
                          <span>12-14</span>
                          <span>15-17</span>
                          <span>18-21</span>
                          <span>22+</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-indigo-600 inline-block" /> Dine-In (Makan Sini)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-teal-400 inline-block" /> Takeaway (Bungkus)</span>
                    </div>
                  </div>

                  {/* CARD 3: SERVICE WAIT TIMES / MONITORING MEJA & WAKTU LAYANAN */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight font-heading">
                            Monitoring Meja & Layanan
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Estimasi waktu penyajian per area resto
                          </p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Service Table */}
                      <div className="overflow-x-auto pt-2">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100">
                            <tr>
                              <th className="pb-2">Area Resto</th>
                              <th className="pb-2">Waktu</th>
                              <th className="pb-2">Target</th>
                              <th className="pb-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            <tr className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 font-bold text-slate-800">Indoor (Meja 01)</td>
                              <td className="py-2.5 font-mono text-slate-600 font-bold">10 Menit</td>
                              <td className="py-2.5 text-slate-400">15m</td>
                              <td className="py-2.5 text-right font-extrabold text-emerald-600">Selesai</td>
                            </tr>
                            <tr className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 font-bold text-slate-800">Outdoor (Meja 04)</td>
                              <td className="py-2.5 font-mono text-slate-600 font-bold">14 Menit</td>
                              <td className="py-2.5 text-slate-400">15m</td>
                              <td className="py-2.5 text-right font-extrabold text-blue-600">Dapur</td>
                            </tr>
                            <tr className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 font-bold text-slate-800">VIP Room (Meja 08)</td>
                              <td className="py-2.5 font-mono text-slate-600 font-bold">06 Menit</td>
                              <td className="py-2.5 text-slate-400">10m</td>
                              <td className="py-2.5 text-right font-extrabold text-purple-600">Siap Saji</td>
                            </tr>
                            <tr className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 font-bold text-slate-800">POS Takeaway</td>
                              <td className="py-2.5 font-mono text-slate-600 font-bold">04 Menit</td>
                              <td className="py-2.5 text-slate-400">08m</td>
                              <td className="py-2.5 text-right font-extrabold text-amber-600">Pending</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveMenu('tables')}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline pt-2 border-t border-slate-100"
                    >
                      Kelola Denah & Status Meja &rarr;
                    </button>
                  </div>

                </div>

              </div>
            );
          })()}

          {/* SECTION 6: PENGATURAN KAFE & PPN / PAJAK (SETTINGS) */}
          {activeMenu === 'settings' && (
            <div className="space-y-6 max-w-5xl">
              
              {/* Top Title Bar Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-heading tracking-tight">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Pengaturan Kafe, PPN & Sistem POS
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Atur identitas kafe, persentase pajak PPN/PB1, biaya layanan, Wi-Fi, dan template struk pembayaran.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>

              {/* Toast Notification */}
              {settingsSavedToast && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 animate-fade-in shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-emerald-950">Pengaturan Berhasil Disimpan!</h4>
                    <p className="text-[11px] text-emerald-800">
                      Nama kafe, aturan pajak PPN, dan konfigurasi struk telah diperbarui secara langsung di seluruh sistem.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* GRID: Identitas Kafe & Pajak/PPN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* CARD 1: Identitas & Branding Kafe */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">Identitas Kafe & Branding</h3>
                        <p className="text-[10px] text-slate-400">Ditampilkan pada header menu, login, dan struk</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-extrabold text-slate-800 block mb-1">
                          Nama Aplikasi / Kafe <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.appName}
                          onChange={e => setSettingsForm({ ...settingsForm, appName: e.target.value })}
                          placeholder="Contoh: CaffePOS Resto / Kopi Kenangan"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-800 block mb-1">
                          Slogan / Tagline
                        </label>
                        <input
                          type="text"
                          value={settingsForm.caffeTagline}
                          onChange={e => setSettingsForm({ ...settingsForm, caffeTagline: e.target.value })}
                          placeholder="Contoh: Premium Artisan Coffee & Eatery"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-800 block mb-1">
                          Alamat Lengkap Kafe
                        </label>
                        <textarea
                          rows="2"
                          value={settingsForm.caffeAddress}
                          onChange={e => setSettingsForm({ ...settingsForm, caffeAddress: e.target.value })}
                          placeholder="Contoh: Jl. Malioboro No. 12, Yogyakarta"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-800 block mb-1">
                          Nomor Telepon / WhatsApp Kafe
                        </label>
                        <input
                          type="text"
                          value={settingsForm.caffePhone}
                          onChange={e => setSettingsForm({ ...settingsForm, caffePhone: e.target.value })}
                          placeholder="Contoh: 0812-3456-7890"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Pajak Restoran (PPN / PB1) & Biaya Layanan */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">Pajak Restoran (PPN / PB1)</h3>
                        <p className="text-[10px] text-slate-400">Pengaturan penambahan pajak ke tagihan pesanan</p>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      
                      {/* Toggle PPN Switch */}
                      <div 
                        onClick={() => setSettingsForm(prev => ({ ...prev, enableTax: !prev.enableTax }))}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <div>
                          <p className="font-extrabold text-xs text-slate-900">Aktifkan Pajak (PPN / PB1)</p>
                          <p className="text-[10px] text-slate-500">
                            {settingsForm.enableTax ? 'Pajak dihitung otomatis pada pesanan POS & QR Order' : 'Pajak dinonaktifkan (Tagihan tanpa pajak)'}
                          </p>
                        </div>
                        <div className={`w-12 h-6.5 rounded-full p-1 transition-colors ${settingsForm.enableTax ? 'bg-blue-600' : 'bg-slate-300'}`}>
                          <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${settingsForm.enableTax ? 'translate-x-5.5' : 'translate-x-0'}`} />
                        </div>
                      </div>

                      {/* Tax Rate Input (Only shown if enabled) */}
                      {settingsForm.enableTax && (
                        <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
                          <label className="font-extrabold text-blue-950 block">
                            Persentase Pajak Resto (%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={settingsForm.taxRate}
                              onChange={e => setSettingsForm({ ...settingsForm, taxRate: parseFloat(e.target.value) || 0 })}
                              className="w-28 bg-white border border-blue-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 text-center focus:outline-none focus:border-blue-600"
                            />
                            <span className="font-extrabold text-blue-900 text-sm">%</span>
                            <div className="flex gap-1 ml-auto">
                              <button
                                type="button"
                                onClick={() => setSettingsForm({ ...settingsForm, taxRate: 10 })}
                                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10.5px] border ${settingsForm.taxRate === 10 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
                              >
                                10% (PB1)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettingsForm({ ...settingsForm, taxRate: 11 })}
                                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10.5px] border ${settingsForm.taxRate === 11 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
                              >
                                11% (PPN)
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-blue-700">
                            Contoh: Subtotal Rp 100.000 + Pajak {settingsForm.taxRate}% = Total <strong>{formatRupiah(100000 + (100000 * (settingsForm.taxRate / 100)))}</strong>
                          </p>
                        </div>
                      )}

                      {/* Wi-Fi Hotspot Info */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                          <Wifi className="w-4 h-4 text-emerald-600" />
                          <span>Informasi Wi-Fi Tamu (Dicetak di Struk)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama SSID Wi-Fi</label>
                            <input
                              type="text"
                              value={settingsForm.wifiName}
                              onChange={e => setSettingsForm({ ...settingsForm, wifiName: e.target.value })}
                              placeholder="Caffe_Guest_5G"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Password Wi-Fi</label>
                            <input
                              type="text"
                              value={settingsForm.wifiPassword}
                              onChange={e => setSettingsForm({ ...settingsForm, wifiPassword: e.target.value })}
                              placeholder="kopienakbanget"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* CARD 3: Pengaturan Struk & Catatan Kaki */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Kustomisasi Struk Pembayaran Kasir</h3>
                      <p className="text-[10px] text-slate-400">Pesan penutup dan ucapan terima kasih pada struk belanja</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-3">
                      <div>
                        <label className="font-extrabold text-slate-800 block mb-1">
                          Catatan Kaki Struk (Footer Greeting)
                        </label>
                        <textarea
                          rows="3"
                          value={settingsForm.receiptFooterNote}
                          onChange={e => setSettingsForm({ ...settingsForm, receiptFooterNote: e.target.value })}
                          placeholder="Terima kasih atas kunjungan Anda! Silakan berkunjung kembali."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>

                      <div 
                        onClick={() => setSettingsForm(prev => ({ ...prev, autoPrintReceipt: !prev.autoPrintReceipt }))}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-900">Cetak Otomatis Setelah Bayar (POS)</p>
                          <p className="text-[10px] text-slate-500">Tampilkan dialog cetak struk otomatis saat pembayaran sukses</p>
                        </div>
                        <div className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${settingsForm.autoPrintReceipt ? 'bg-blue-600' : 'bg-slate-300'}`}>
                          <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${settingsForm.autoPrintReceipt ? 'translate-x-4.5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Struk Mini */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between font-mono text-[11px] space-y-2">
                      <div className="text-center border-b border-dashed border-slate-300 pb-2">
                        <p className="font-black text-xs uppercase text-slate-900">{settingsForm.appName || 'NAMA KAFE'}</p>
                        <p className="text-[9.5px] text-slate-500">{settingsForm.caffeTagline || 'Tagline Kafe'}</p>
                        <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{settingsForm.caffeAddress || 'Alamat Kafe'}</p>
                        <p className="text-[9px] text-slate-400">Telp: {settingsForm.caffePhone || '-'}</p>
                      </div>

                      <div className="space-y-1 py-1 border-b border-dashed border-slate-300 text-[10px]">
                        <div className="flex justify-between">
                          <span>1x Cappuccino Latte</span>
                          <span className="font-bold">Rp 35.000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>1x Croissant Butter</span>
                          <span className="font-bold">Rp 25.000</span>
                        </div>
                        <div className="flex justify-between pt-1 text-slate-600">
                          <span>Subtotal</span>
                          <span className="font-bold">Rp 60.000</span>
                        </div>
                        {settingsForm.enableTax && (
                          <div className="flex justify-between text-slate-600">
                            <span>Pajak ({settingsForm.taxRate}%)</span>
                            <span className="font-bold">{formatRupiah(60000 * (settingsForm.taxRate / 100))}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-slate-900 pt-1 text-xs">
                          <span>TOTAL</span>
                          <span>{formatRupiah(settingsForm.enableTax ? 60000 + (60000 * (settingsForm.taxRate / 100)) : 60000)}</span>
                        </div>
                      </div>

                      <div className="text-center pt-1 text-[9px] text-slate-500 space-y-0.5">
                        {settingsForm.wifiName && (
                          <p className="font-bold text-slate-700">Wi-Fi: {settingsForm.wifiName} | Pass: {settingsForm.wifiPassword}</p>
                        )}
                        <p className="italic">"{settingsForm.receiptFooterNote || 'Terima kasih!'}"</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button Bottom Bar */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Pengaturan Kafe & PPN</span>
                  </button>
                </div>

              </form>
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

      {/* ORDER DETAIL MODAL */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-0 max-h-[92vh] flex flex-col border border-slate-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {selectedOrderForDetail.orderNumber || selectedOrderForDetail.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase ${
                    selectedOrderForDetail.paymentStatus === 'paid' || selectedOrderForDetail.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {selectedOrderForDetail.paymentStatus === 'paid' || selectedOrderForDetail.status === 'completed' ? '✓ Lunas' : 'Belum Bayar'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Rincian Nota Transaksi
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedOrderForDetail.createdAt ? formatDateTime(selectedOrderForDetail.createdAt) : '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Info */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Customer & Location Details Card */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Nama Pelanggan</span>
                  <span className="text-xs font-black text-slate-900">{selectedOrderForDetail.customerName || 'Guest Walk-In'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Meja / Lokasi</span>
                  <span className="text-xs font-black text-amber-900">
                    {selectedOrderForDetail.tableNumber ? `Meja ${selectedOrderForDetail.tableNumber}` : 'Takeaway'}
                    <span className="text-[10px] font-normal text-slate-500 ml-1">
                      ({selectedOrderForDetail.orderType === 'takeaway' ? 'Bungkus' : 'Dine-In'})
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Metode Bayar</span>
                  <span className="text-xs font-mono font-bold text-slate-800 uppercase">{selectedOrderForDetail.paymentMethod || 'CASH'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Status Dapur</span>
                  <span className="text-xs font-extrabold text-blue-700 capitalize">
                    {selectedOrderForDetail.status === 'completed' ? 'Selesai' :
                     selectedOrderForDetail.status === 'ready' ? 'Siap Disajikan' :
                     selectedOrderForDetail.status === 'preparing' ? 'Sedang Dibuat (Dapur)' : 'Menunggu Bayar'}
                  </span>
                </div>
              </div>

              {/* Items Ordered List */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-900 block uppercase tracking-wider">
                  Item Yang Dipesan ({selectedOrderForDetail.items ? selectedOrderForDetail.items.length : 0})
                </span>

                <div className="space-y-2">
                  {(selectedOrderForDetail.items || []).map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">
                            {item.quantity}x {item.productName}
                          </h4>
                          <span className="text-[10.5px] font-mono text-slate-500">
                            @{formatRupiah(item.unitPrice)}
                          </span>
                        </div>
                        <span className="font-mono font-black text-xs text-slate-900">
                          {formatRupiah(item.subtotal || (item.quantity * item.unitPrice))}
                        </span>
                      </div>

                      {/* Variants & Toppings */}
                      {item.selectedVariants && item.selectedVariants.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.selectedVariants.map((v, vIdx) => (
                            <span key={vIdx} className="text-[9px] bg-amber-50 text-amber-900 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                              {v}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Special Notes */}
                      {item.notes && (
                        <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          Catatan: "{item.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">{formatRupiah(selectedOrderForDetail.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pajak Resto PB1 (10%):</span>
                  <span className="font-mono font-bold">{formatRupiah(selectedOrderForDetail.tax || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-blue-700 font-black">{formatRupiah(selectedOrderForDetail.total || 0)}</span>
                </div>
                {selectedOrderForDetail.amountPaid && selectedOrderForDetail.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Uang Diterima (Cash):</span>
                      <span className="font-mono font-bold">{formatRupiah(selectedOrderForDetail.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Kembalian:</span>
                      <span className="font-mono">{formatRupiah(selectedOrderForDetail.changeAmount || 0)}</span>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-300 transition"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetOrd = selectedOrderForDetail;
                  setSelectedOrderForDetail(null);
                  setSelectedOrderForReceipt(targetOrd);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
