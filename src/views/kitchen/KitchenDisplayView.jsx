import React from 'react';
import { UtensilsCrossed, Clock, CheckCircle, Coffee, Bell } from 'lucide-react';

export default function KitchenDisplayView({ orders, updateOrderStatus }) {
  const kitchenOrders = orders.filter(
    order => order.status === 'preparing' || order.status === 'ready'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-20">
      
      {/* Kitchen Display Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-900 p-5 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              Kitchen & Barista Display (KDS)
            </h2>
            <p className="text-xs text-gray-400">
              Antrean pemrosesan pesanan real-time untuk Dapur & Barista.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>Aktif di Dapur: <strong>{kitchenOrders.length} Pesanan</strong></span>
          </div>
        </div>
      </div>

      {/* Ticket Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="py-20 text-center text-gray-500 glass rounded-2xl space-y-3">
          <Coffee className="w-16 h-16 mx-auto opacity-20" />
          <h3 className="text-base font-bold text-gray-400">Tidak ada antrean pesanan di Dapur</h3>
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
                className={`bg-gray-900 rounded-2xl overflow-hidden border transition-all flex flex-col justify-between shadow-xl ${
                  order.status === 'ready'
                    ? 'border-purple-500/50 bg-purple-950/10'
                    : isLate
                    ? 'border-red-500/50 bg-red-950/10'
                    : 'border-amber-500/40'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 bg-gray-950/80 border-b border-gray-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
                      <h3 className="text-xl font-extrabold text-amber-400">Meja {order.tableNumber}</h3>
                    </div>

                    <div className="text-right space-y-1">
                      <div className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                        isLate ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-gray-800 text-gray-300'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{elapsedMinutes} mnt lalu</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{order.customerName}</p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-800/60 p-3 rounded-xl border border-gray-800 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-white text-sm">
                            <span className="text-amber-400 font-mono text-base mr-1.5">{item.quantity}x</span>
                            {item.productName}
                          </span>
                        </div>

                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.selectedVariants.map((v, vIdx) => (
                              <span key={vIdx} className="bg-amber-500/10 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                                {v}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-xs text-red-400 font-bold pt-1 flex items-center gap-1">
                            ⚠️ Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-gray-950/60 border-t border-gray-800">
                  {order.status === 'preparing' ? (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Tandai SIAP DISAJIKAN</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-xs bg-purple-500/20 text-purple-300 p-2.5 rounded-xl border border-purple-500/30 font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-purple-400" /> Siap Diantar Pelayan
                      </span>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="text-[11px] bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg text-white"
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
