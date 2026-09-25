import React from 'react';
import { Coffee, QrCode, Monitor, UtensilsCrossed, Database, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function Header({ activeView, setActiveView, selectedTable, setSelectedTable, tables, cartCount, openCart }) {
  return (
    <header className="glass sticky top-0 z-40 border-b border-gray-800 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-600/30">
            <Coffee className="w-6 h-6 text-gray-950 font-bold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              CAFFE<span className="text-amber-500 font-extrabold">POS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                QR Self-Order
              </span>
            </h1>
            <p className="text-xs text-gray-400">Sistem Pesan Meja & Kasir Terintegrasi</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-800 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveView('customer')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'customer'
                ? 'bg-amber-600 text-white shadow-md font-semibold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Pelanggan (Scan Meja)</span>
          </button>

          <button
            onClick={() => setActiveView('cashier')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'cashier'
                ? 'bg-amber-600 text-white shadow-md font-semibold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Kasir (POS)</span>
          </button>

          <button
            onClick={() => setActiveView('kitchen')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'kitchen'
                ? 'bg-amber-600 text-white shadow-md font-semibold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Dapur / Barista</span>
          </button>

          <button
            onClick={() => setActiveView('database')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'database'
                ? 'bg-amber-600 text-white shadow-md font-semibold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Rancangan DB</span>
          </button>
        </nav>

        {/* Right Section: Table Selector & Cart Trigger */}
        <div className="flex items-center gap-3">
          {activeView === 'customer' && (
            <>
              {/* Table Selector Simulator */}
              <div className="flex items-center gap-2 bg-gray-900 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  Simulasi QR Meja:
                </span>
                <select
                  value={selectedTable.id}
                  onChange={(e) => {
                    const found = tables.find(t => t.id === e.target.value);
                    if (found) setSelectedTable(found);
                  }}
                  className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none cursor-pointer"
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
                className="relative flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-xl font-medium text-xs shadow-lg shadow-amber-600/20 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Keranjang</span>
                {cartCount > 0 && (
                  <span className="bg-white text-amber-700 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          )}

          {activeView === 'cashier' && (
            <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Kasir Active: <strong>Kasir #01</strong></span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
