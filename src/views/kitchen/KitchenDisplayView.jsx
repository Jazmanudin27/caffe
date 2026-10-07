import React, { useState } from 'react';
import { UtensilsCrossed, Clock, CheckCircle, Coffee, Search, Layers, ChefHat } from 'lucide-react';

export default function KitchenDisplayView({ orders, updateOrderStatus }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Kitchen relevant orders ('preparing' or 'ready')
  const baseKitchenOrders = orders.filter(
    order => order.status === 'preparing' || order.status === 'ready'
  );

  const filteredOrders = baseKitchenOrders.filter(order => {
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const countPreparing = baseKitchenOrders.filter(o => o.status === 'preparing').length;
  const countReady = baseKitchenOrders.filter(o => o.status === 'ready').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-24 text-gray-800">
      
      {/* Filter Tabs & Search Navigation Bar (Same as Cashier View) */}
      <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-amber-500/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/30'
                : 'bg-amber-50/50 text-gray-700 hover:bg-amber-100/60 border border-amber-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Antrean Dapur ({baseKitchenOrders.length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('preparing')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'preparing'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/30'
                : 'bg-blue-50/50 text-blue-800 hover:bg-blue-100/60 border border-blue-200/60'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Proses Dimasak ({countPreparing})</span>
          </button>

          <button
            onClick={() => setFilterStatus('ready')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'ready'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/30'
                : 'bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60 border border-emerald-200/60'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Siap Disajikan ({countReady})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Meja, No Pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
      </div>

      {/* Ticket Grid */}
      {filteredOrders.length === 0 ? (
        <div className="py-20 text-center text-gray-500 bg-white border border-amber-500/20 rounded-3xl space-y-3 shadow-sm">
          <Coffee className="w-16 h-16 mx-auto opacity-30 text-amber-600" />
          <h3 className="text-base font-extrabold text-gray-800">Tidak Ada Antrean Pesanan Dapur</h3>
          <p className="text-xs text-gray-500">Pesanan baru yang telah diverifikasi kasir akan muncul otomatis di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => {
            const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const isLate = elapsedMinutes > 15;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl overflow-hidden border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                  order.status === 'ready'
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : isLate
                    ? 'border-red-500 bg-red-50/20'
                    : 'border-amber-500/30'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 bg-amber-50/70 border-b border-amber-500/20 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-amber-800 block">{order.orderNumber}</span>
                      <h3 className="text-xl font-black text-gray-900">Meja {order.tableNumber}</h3>
                    </div>

                    <div className="text-right space-y-1">
                      <div className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl font-bold ${
                        isLate ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse' : 'bg-white text-gray-700 border border-gray-200'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsedMinutes} mnt lalu</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-bold">{order.customerName}</p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 space-y-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-amber-50/40 p-3 rounded-2xl border border-amber-500/15 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-gray-900 text-sm">
                            <span className="text-amber-800 font-mono text-base font-black mr-1.5">{item.quantity}x</span>
                            {item.productName}
                          </span>
                        </div>

                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.selectedVariants.map((v, vIdx) => (
                              <span key={vIdx} className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md border border-amber-300 font-bold">
                                {v}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-xs text-red-600 font-bold pt-1 flex items-center gap-1">
                            ⚠️ Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-amber-50/60 border-t border-amber-500/20">
                  {order.status === 'preparing' ? (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/30 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Tandai SIAP DISAJIKAN</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-xs bg-emerald-100 text-emerald-900 p-3 rounded-2xl border border-emerald-300 font-extrabold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-700" /> Siap Diantar Pelayan
                      </span>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl font-bold transition shadow-sm"
                      >
                        Selesai
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
