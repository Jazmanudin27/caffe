import React, { useState } from 'react';
import { 
  Monitor, CheckCircle, Clock, Printer, DollarSign, 
  Search, AlertTriangle, ChefHat, Sparkles, Receipt, ArrowRight, ShieldAlert, Layers
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';
import { formatRupiah, formatRupiahInput, getNumericValue, formatDateTime } from '../../utils/formatters';

export default function CashierPosView({ orders, updateOrderStatus, updateOrderPayment, selectedTable }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment modal state
  const [cashModalOrder, setCashModalOrder] = useState(null);
  const [cashReceived, setCashReceived] = useState('');
  
  // Receipt view state
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'pending_payment' && order.status === 'pending_payment') ||
      (filterStatus === 'paid' && order.paymentStatus === 'paid') ||
      (filterStatus === 'preparing' && order.status === 'preparing') ||
      (filterStatus === 'completed' && order.status === 'completed');

    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate change
  const numericCash = getNumericValue(cashReceived);
  const changeAmount = cashModalOrder ? Math.max(0, numericCash - cashModalOrder.total) : 0;
  const isEnoughCash = cashModalOrder ? numericCash >= cashModalOrder.total : false;

  const handleConfirmCashPayment = () => {
    if (!cashModalOrder || !isEnoughCash) return;
    
    updateOrderPayment(cashModalOrder.id, {
      paymentStatus: 'paid',
      amountPaid: numericCash,
      changeAmount: changeAmount,
      status: 'preparing'
    });

    const updated = {
      ...cashModalOrder,
      paymentStatus: 'paid',
      amountPaid: numericCash,
      changeAmount: changeAmount,
      status: 'preparing'
    };

    setCashModalOrder(null);
    setCashReceived('');
    setReceiptOrder(updated);
  };

  const countPending = orders.filter(o => o.status === 'pending_payment').length;
  const countPreparing = orders.filter(o => o.status === 'preparing').length;
  const countCompleted = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-24 text-gray-800">
      


      {/* Filter Tabs & Search Navigation Bar */}
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
            <span>Semua Pesanan ({orders.length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('pending_payment')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'pending_payment'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/30 animate-pulse'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            <span>Menunggu Cash ({countPending})</span>
          </button>

          <button
            onClick={() => setFilterStatus('preparing')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'preparing'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-blue-600" />
            <span>Proses Dapur ({countPreparing})</span>
          </button>

          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai ({countCompleted})</span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari Nota, Meja, Nama..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-amber-50/30 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition"
          />
        </div>
      </div>

      {/* Interactive Orders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white/90 rounded-3xl border-2 border-dashed border-amber-300 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-100/80 flex items-center justify-center mb-3">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-base font-extrabold text-gray-800">Tidak ada transaksi ditemukan</h3>
            <p className="text-xs text-gray-500 mt-1">Coba ganti filter atau kata kunci pencarian Anda.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isPendingCash = order.status === 'pending_payment';
            const isPaid = order.paymentStatus === 'paid';

            return (
              <div
                key={order.id}
                className={`rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  isPendingCash
                    ? 'bg-gradient-to-b from-amber-50/90 via-white to-orange-50/40 border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10'
                    : order.status === 'preparing'
                    ? 'bg-gradient-to-b from-blue-50/70 via-white to-indigo-50/30 border-blue-300'
                    : order.status === 'completed'
                    ? 'bg-gradient-to-b from-emerald-50/70 via-white to-teal-50/30 border-emerald-300'
                    : 'bg-white border-amber-200'
                }`}
              >
                <div>
                  {/* Top Colored Header Bar */}
                  <div className={`px-5 py-3.5 flex justify-between items-center text-white ${
                    isPendingCash
                      ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600'
                      : order.status === 'preparing'
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-800'
                      : order.status === 'ready'
                      ? 'bg-gradient-to-r from-purple-700 to-pink-700'
                      : 'bg-gradient-to-r from-emerald-700 to-teal-800'
                  }`}>
                    <div>
                      <span className="text-[10px] font-mono font-black text-amber-200 tracking-wider uppercase opacity-90 block">
                        {order.orderNumber}
                      </span>
                      <h3 className="font-extrabold text-white text-base leading-snug">{order.customerName}</h3>
                    </div>

                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-center border border-white/30">
                      <span className="text-[10px] text-white/90 uppercase tracking-widest block font-bold">Meja</span>
                      <span className="font-black text-white text-sm font-mono leading-none">{order.tableNumber}</span>
                    </div>
                  </div>

                  {/* Status Badges Section */}
                  <div className="px-5 pt-3.5 flex items-center justify-between gap-2">
                    {/* Payment Badge */}
                    {isPaid ? (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lunas ({order.paymentMethod.toUpperCase()})</span>
                      </span>
                    ) : (
                      <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-orange-950 border border-orange-400 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                        <span>Belum Bayar (Cash)</span>
                      </span>
                    )}

                    {/* Kitchen Status Tag */}
                    {order.status === 'preparing' && (
                      <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1">
                        <ChefHat className="w-3 h-3 text-blue-600" /> Dapur
                      </span>
                    )}
                    {order.status === 'ready' && (
                      <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-1 rounded-xl text-[11px] font-black">
                        Siap Saji
                      </span>
                    )}
                    {order.status === 'completed' && (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-black">
                        Selesai
                      </span>
                    )}
                  </div>

                  {/* Order Items Table/List */}
                  <div className="p-5 space-y-2.5">
                    <div className="bg-amber-50/50 rounded-2xl p-3 border border-amber-200/50 space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs border-b border-amber-200/30 pb-1.5 last:border-b-0 last:pb-0">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-gray-900">
                              <span className="bg-amber-600 text-white font-mono font-black text-[10px] px-1.5 py-0.5 rounded-md">
                                {item.quantity}x
                              </span>
                              <span>{item.productName}</span>
                            </div>
                            {item.selectedVariants && item.selectedVariants.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-6">
                                {item.selectedVariants.map((v, vIdx) => (
                                  <span key={vIdx} className="bg-amber-100 text-amber-900 font-semibold text-[9px] px-1.5 py-0.5 rounded-md border border-amber-300/60">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-[10px] text-amber-900/70 italic pl-6 font-medium">"{item.notes}"</p>
                            )}
                          </div>
                          <span className="font-mono text-gray-900 font-bold text-xs">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                      <span>Waktu Pesan:</span>
                      <span className="font-semibold text-gray-600">{formatDateTime(order.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar & Total */}
                <div className="p-5 pt-0 space-y-3">
                  <div className="bg-gradient-to-r from-amber-100/80 via-amber-50 to-orange-100/80 p-3.5 rounded-2xl border border-amber-300 flex justify-between items-center">
                    <span className="text-gray-700 text-xs font-bold uppercase tracking-wider">Total Tagihan</span>
                    <span className="font-black font-mono text-amber-900 text-lg">
                      {formatRupiah(order.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'pending_payment' && (
                      <button
                        onClick={() => {
                          setCashModalOrder(order);
                          setCashReceived(formatRupiahInput(order.total));
                        }}
                        className="flex-1 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black py-3.5 min-h-[44px] rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition transform active:scale-95"
                      >
                        <DollarSign className="w-4 h-4 text-amber-300" />
                        <span>Terima Cash</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                      </button>
                    )}

                    <button
                      onClick={() => setReceiptOrder(order)}
                      className="px-3.5 py-3.5 min-h-[44px] bg-white hover:bg-amber-100 text-amber-900 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border border-amber-400 shadow-sm transition active:scale-95"
                      title="Cetak Struk"
                    >
                      <Printer className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold">Struk</span>
                    </button>

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 min-h-[44px] rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Tandai Selesai</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* CASH PAYMENT VERIFICATION MODAL */}
      {cashModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white border-2 border-amber-500/40 text-gray-900 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl overflow-hidden relative">
            
            <div className="flex justify-between items-center pb-4 border-b border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Pembayaran Tunai Kasir</h3>
                  <p className="text-[11px] text-gray-500">Hitung kembalian & konfirmasi transaksi</p>
                </div>
              </div>
              <button 
                onClick={() => setCashModalOrder(null)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-300 space-y-1.5 shadow-inner">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Nota: <strong className="font-mono text-amber-900 font-extrabold">{cashModalOrder.orderNumber}</strong></span>
                  <span className="font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-lg border border-amber-300">
                    Meja {cashModalOrder.tableNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-gray-900 pt-2 border-t border-amber-200/60">
                  <span className="text-gray-700">Total Tagihan:</span>
                  <span className="text-amber-900 font-mono text-xl font-black">
                    {formatRupiah(cashModalOrder.total)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-gray-900 block mb-1.5 text-xs">Uang Tunai Diterima (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-amber-800 font-black font-mono text-lg pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    placeholder="0"
                    value={cashReceived}
                    onChange={e => setCashReceived(formatRupiahInput(e.target.value))}
                    className="w-full bg-amber-50/40 border-2 border-amber-500/40 rounded-2xl pl-12 pr-4 py-3.5 text-xl font-black font-mono text-amber-950 text-right focus:outline-none focus:border-amber-600 focus:bg-white shadow-sm transition"
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Pilihan Cepat</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Uang Pas', val: cashModalOrder.total },
                    { label: '50.000', val: 50000 },
                    { label: '100.000', val: 100000 },
                    { label: '200.000', val: 200000 },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setCashReceived(formatRupiahInput(preset.val))}
                      className="py-2.5 px-2 bg-amber-100/70 hover:bg-amber-200 border border-amber-300 rounded-xl text-[11px] font-black text-amber-900 transition active:scale-95 shadow-sm"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian Calculation */}
              <div className={`p-4 rounded-2xl border-2 flex justify-between items-center transition ${
                isEnoughCash 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <span className="font-extrabold text-xs">Uang Kembalian:</span>
                <span className={`font-mono text-xl font-black ${isEnoughCash ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {isEnoughCash ? formatRupiah(changeAmount) : 'Uang Kurang!'}
                </span>
              </div>
            </div>

            <button
              disabled={!isEnoughCash}
              onClick={handleConfirmCashPayment}
              className={`w-full py-4 rounded-2xl font-black text-xs shadow-xl transition flex items-center justify-center gap-2 transform active:scale-95 ${
                isEnoughCash
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-600/30 hover:brightness-110'
                  : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4.5 h-4.5" />
              <span>Konfirmasi Lunas & Kirim ke Dapur</span>
            </button>

          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}

    </div>
  );
}

