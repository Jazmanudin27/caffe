import React from 'react';
import { UtensilsCrossed, Clock, CheckCircle, Coffee, Bell } from 'lucide-react';

export default function KitchenDisplayView({ orders, updateOrderStatus }) {
  const kitchenOrders = orders.filter(
    order => order.status === 'preparing' || order.status === 'ready'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-20 text-gray-800">
      
      {/* Kitchen Display Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-amber-500/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              Kitchen & Barista Display (KDS)
            </h2>
            <p className="text-xs text-gray-500">
              Antrean pemrosesan pesanan real-time untuk Dapur & Barista.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-purple-100 border border-purple-300 text-purple-900 px-4 py-2 rounded-2xl text-xs font-bold">
            <Bell className="w-4 h-4 text-purple-700 animate-bounce" />
            <span>Aktif di Dapur: <strong className="text-purple-800 font-mono text-sm">{kitchenOrders.length} Pesanan</strong></span>
          </div>
        </div>
      </div>

      {/* Ticket Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="py-20 text-center text-gray-500 bg-white border border-amber-500/20 rounded-3xl space-y-3 shadow-sm">
          <Coffee className="w-16 h-16 mx-auto opacity-30 text-amber-600" />
          <h3 className="text-base font-extrabold text-gray-800">Tidak ada antrean pesanan di Dapur</h3>
          <p className="text-xs text-gray-500">Pesanan baru yang telah terbayar akan muncul otomatis di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kitchenOrders.map(order => {
            const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const isLate = elapsedMinutes > 15;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl overflow-hidden border transition-all flex flex-col justify-between shadow-sm ${
                  order.status === 'ready'
                    ? 'border-purple-500 bg-purple-50/20 shadow-md'
                    : isLate
                    ? 'border-red-500 bg-red-50/20 shadow-md'
                    : 'border-amber-500/30'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 bg-amber-50/70 border-b border-amber-500/20 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-800">{order.orderNumber}</span>
                      <h3 className="text-xl font-black text-gray-900">Meja {order.tableNumber}</h3>
                    </div>

                    <div className="text-right space-y-1">
                      <div className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-xl font-bold ${
                        isLate ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse' : 'bg-white text-gray-700 border border-gray-200'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsedMinutes} mnt lalu</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">{order.customerName}</p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 space-y-3">
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
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Tandai SIAP DISAJIKAN</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-xs bg-purple-100 text-purple-900 p-3 rounded-2xl border border-purple-300 font-extrabold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-purple-700" /> Siap Diantar Pelayan
                      </span>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="text-[11px] bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-3 py-1 rounded-xl font-bold"
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
