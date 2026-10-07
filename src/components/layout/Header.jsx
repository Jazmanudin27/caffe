import React from 'react';
import { Coffee, ShoppingBag, Sparkles, CircleDot, ShieldCheck, LogOut, UserCheck } from 'lucide-react';

export default function Header({ activeView, selectedTable, setSelectedTable, tables, cartCount, openCart, staffUser, onLogoutStaff }) {
  const isDarkHeader = activeView === 'cashier' || activeView === 'kitchen';

  return (
    <header className={`sticky top-0 z-40 px-4 py-3.5 transition-all duration-300 ${
      isDarkHeader
        ? 'bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white border-b border-amber-600/40 shadow-xl'
        : 'glass-panel border-b border-amber-500/10'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-700 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
            <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl border ${
              isDarkHeader
                ? 'bg-gradient-to-tr from-amber-800 to-orange-600 border-amber-400/60'
                : 'bg-gradient-to-tr from-amber-950 via-gray-900 to-amber-900 border-amber-500/40'
            }`}>
              <Coffee className="w-6 h-6 text-amber-300 transform group-hover:rotate-12 transition duration-300" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-extrabold tracking-tight flex items-center gap-1.5 ${
                isDarkHeader ? 'text-white' : 'text-gray-900'
              }`}>
                CAFFE<span className="text-amber-500">POS</span>
              </h1>
              {activeView !== 'customer' && (
                <span className={`text-[10px] font-black px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm ${
                  isDarkHeader 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-300/40' 
                    : 'gradient-badge text-amber-800'
                }`}>
                  <Sparkles className="w-3 h-3 text-amber-300" /> 
                  {activeView === 'cashier' && 'KASIR POS'}
                  {activeView === 'kitchen' && 'DAPUR KDS'}
                  {activeView === 'admin' && 'ADMIN CONTROL PANEL'}
                </span>
              )}
            </div>
            {activeView !== 'customer' && (
              <p className={`text-[11px] font-medium ${isDarkHeader ? 'text-amber-200/80' : 'text-gray-500'}`}>
                {activeView === 'cashier' && 'Sistem Pembayaran & Kasir Restoran'}
                {activeView === 'kitchen' && 'Display Antrean Barista & Dapur'}
                {activeView === 'admin' && 'Kelola Produk, Harga & Laporan Omset'}
              </p>
            )}
          </div>
        </div>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-2.5">
          {activeView === 'customer' && (
            <>
              {/* Table Selector Dropdown */}
              <div className="hidden sm:flex items-center gap-2 bg-white border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-sm">
                <CircleDot className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="text-[11px] text-gray-500 font-medium">Meja:</span>
                <select
                  value={selectedTable.id}
                  onChange={(e) => {
                    const found = tables.find(t => t.id === e.target.value);
                    if (found) setSelectedTable(found);
                  }}
                  className="bg-transparent text-amber-700 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id} className="bg-white text-gray-900">
                      Meja {tbl.number} ({tbl.capacity} Kursi)
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Button */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2.5 gradient-gold text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all transform hover:scale-[1.03]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Keranjang</span>
                {cartCount > 0 && (
                  <span className="bg-white text-amber-900 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center border border-amber-300 shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Protected Staff Views User Badge & Logout */}
          {activeView !== 'customer' && staffUser && (
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm border ${
                isDarkHeader
                  ? 'bg-amber-900/80 text-amber-200 border-amber-500/40'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-mono">{staffUser.name}</span>
              </div>

              <button
                onClick={onLogoutStaff}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow transition"
                title="Keluar Sesi Staf"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Keluar</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}


