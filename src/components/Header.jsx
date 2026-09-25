import React from 'react';
import { Coffee, ShoppingBag, Sparkles, CircleDot, ShieldCheck } from 'lucide-react';

export default function Header({ activeView, selectedTable, setSelectedTable, tables, cartCount, openCart }) {
  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-amber-500/10 px-4 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => window.location.href = '/'}>
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
              <span className="gradient-badge text-[10px] font-bold px-2.5 py-0.5 rounded-full text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> 
                {activeView === 'customer' && 'QR SELF-ORDER'}
                {activeView === 'cashier' && 'KASIR POS'}
                {activeView === 'kitchen' && 'DAPUR KDS'}
                {activeView === 'admin' && 'ADMIN CONTROL PANEL'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              {activeView === 'customer' && 'Artisan Coffee & Smart Table Ordering'}
              {activeView === 'cashier' && 'Sistem Pembayaran & Kasir Restoran'}
              {activeView === 'kitchen' && 'Display Antrean Barista & Dapur'}
              {activeView === 'admin' && 'Kelola Produk, Harga & Laporan Omset'}
            </p>
          </div>
        </div>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-3">
          {activeView === 'customer' && (
            <>
              {/* Table Selector Dropdown (Simulasi Meja) */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-950/90 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-inner">
                <CircleDot className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px] text-gray-400 font-medium">Meja:</span>
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
                <span className="hidden sm:inline">Keranjang</span>
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
              <span>Halaman Kasir Aktif</span>
            </div>
          )}

          {activeView === 'kitchen' && (
            <div className="gradient-badge px-3.5 py-1.5 rounded-xl text-xs font-semibold text-purple-400 border border-purple-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>Halaman Dapur Aktif</span>
            </div>
          )}

          {activeView === 'admin' && (
            <div className="gradient-badge px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Session Admin</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
