import React from 'react';
import { Coffee, QrCode, Monitor, UtensilsCrossed, Database, ShoppingBag, Sparkles, ChevronDown, CircleDot } from 'lucide-react';

export default function Header({ activeView, setActiveView, selectedTable, setSelectedTable, tables, cartCount, openCart }) {
  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-amber-500/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-700 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-950 via-gray-900 to-amber-900 border border-amber-500/40 flex items-center justify-center shadow-2xl">
                <Coffee className="w-6 h-6 text-amber-400 transform group-hover:rotate-12 transition duration-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  CAFFE<span className="text-amber-500">POS</span>
                </h1>
                <span className="gradient-badge text-[10px] font-bold px-2 py-0.5 rounded-full text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> QR SELF-ORDER
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Artisan Coffee & Smart Table POS System</p>
            </div>
          </div>

          {/* Cart Icon Mobile Trigger */}
          {activeView === 'customer' && (
            <button
              onClick={openCart}
              className="lg:hidden relative p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Navigation Mode Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-gray-950/80 p-1.5 rounded-2xl border border-white/5 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveView('customer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              activeView === 'customer'
                ? 'gradient-gold text-gray-950 font-extrabold shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Pelanggan (Scan Meja)</span>
          </button>

          <button
            onClick={() => setActiveView('cashier')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              activeView === 'cashier'
                ? 'gradient-gold text-gray-950 font-extrabold shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Kasir (POS)</span>
          </button>

          <button
            onClick={() => setActiveView('kitchen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              activeView === 'kitchen'
                ? 'gradient-gold text-gray-950 font-extrabold shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Dapur / Barista</span>
          </button>

          <button
            onClick={() => setActiveView('database')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              activeView === 'database'
                ? 'gradient-gold text-gray-950 font-extrabold shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Rancangan DB</span>
          </button>
        </nav>

        {/* Right Action Widgets */}
        <div className="hidden lg:flex items-center gap-3">
          {activeView === 'customer' && (
            <>
              {/* Table Selector Dropdown */}
              <div className="flex items-center gap-2 bg-gray-950/90 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-inner">
                <CircleDot className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px] text-gray-400 font-medium">Pilih Meja:</span>
                <select
                  value={selectedTable.id}
                  onChange={(e) => {
                    const found = tables.find(t => t.id === e.target.value);
                    if (found) setSelectedTable(found);
                  }}
                  className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id} className="bg-gray-900 text-gray-100">
                      Meja {tbl.number} ({tbl.capacity} Kursi)
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Button */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2.5 gradient-gold text-gray-950 font-extrabold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all transform hover:scale-[1.03]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Keranjang</span>
                {cartCount > 0 && (
                  <span className="bg-gray-950 text-amber-400 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center border border-amber-500/40">
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          )}

          {activeView === 'cashier' && (
            <div className="gradient-badge px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Shift Kasir: <strong>Kasir #01 (Aktif)</strong></span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
