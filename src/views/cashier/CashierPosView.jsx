import React, { useState } from 'react';
import { 
  Monitor, CheckCircle, Clock, Printer, DollarSign, 
  Search, AlertTriangle
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-20 text-gray-800">
      
      {/* Cashier Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-amber-500/20 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-amber-600" />
            Dashboard Kasir & Pemrosesan Pembayaran
          </h2>
          <p className="text-xs text-gray-500">
            Kelola transaksi masuk dari QR Code Meja & verifikasi pembayaran tunai di kasir.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="bg-amber-100/70 border border-amber-300 px-3 py-2 rounded-2xl text-amber-900">
            Pending Cash: <strong className="text-amber-800 font-mono text-sm">{orders.filter(o => o.status === 'pending_payment').length}</strong>
          </div>
          <div className="bg-blue-100/70 border border-blue-300 px-3 py-2 rounded-2xl text-blue-900">
            Sedang Diproses: <strong className="text-blue-800 font-mono text-sm">{orders.filter(o => o.status === 'preparing').length}</strong>
          </div>
          <div className="bg-emerald-100/70 border border-emerald-300 px-3 py-2 rounded-2xl text-emerald-900">
            Selesai: <strong className="text-emerald-800 font-mono text-sm">{orders.filter(o => o.status === 'completed').length}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition ${
              filterStatus === 'all' ? 'gradient-gold text-white shadow-md' : 'bg-white text-gray-700 border border-amber-500/20 hover:bg-amber-50'
            }`}
          >
            Semua Pesanan ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending_payment')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition ${
              filterStatus === 'pending_payment' ? 'gradient-gold text-white shadow-md' : 'bg-white text-gray-700 border border-amber-500/20 hover:bg-amber-50'
            }`}
          >
            Menunggu Bayar Cash ({orders.filter(o => o.status === 'pending_payment').length})
          </button>
          <button
            onClick={() => setFilterStatus('preparing')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition ${
              filterStatus === 'preparing' ? 'gradient-gold text-white shadow-md' : 'bg-white text-gray-700 border border-amber-500/20 hover:bg-amber-50'
            }`}
          >
            Proses Dapur ({orders.filter(o => o.status === 'preparing').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition ${
              filterStatus === 'completed' ? 'gradient-gold text-white shadow-md' : 'bg-white text-gray-700 border border-amber-500/20 hover:bg-amber-50'
            }`}
          >
            Selesai ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari Nota, Meja, Nama..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-amber-500/30 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 shadow-sm"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-3xl border border-amber-500/20 shadow-sm">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-30 text-amber-600" />
            <p className="text-sm font-bold text-gray-700">Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                order.status === 'pending_payment'
                  ? 'border-amber-500 shadow-md bg-amber-50/30'
                  : 'border-amber-500/20'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-amber-800">{order.orderNumber}</span>
                    <h3 className="font-extrabold text-gray-900 text-base">{order.customerName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-amber-100 text-amber-900 font-black px-3 py-1 rounded-xl text-xs border border-amber-300">
                      Meja {order.tableNumber}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 pt-3 text-xs">
                  {order.paymentStatus === 'paid' ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Lunas ({order.paymentMethod.toUpperCase()})
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-700" /> Belum Bayar (Cash)
                    </span>
                  )}

                  {order.status === 'preparing' && <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-xl font-bold">Dapur Menyiapkan</span>}
                  {order.status === 'ready' && <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-1 rounded-xl font-bold">Siap Disajikan</span>}
                  {order.status === 'completed' && <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl font-bold">Selesai</span>}
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5 pt-3 text-xs text-gray-700">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-amber-800">{item.quantity}x</span> <span className="font-bold text-gray-900">{item.productName}</span>
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <p className="text-[10px] text-amber-700 font-medium">({item.selectedVariants.join(', ')})</p>
                        )}
                        {item.notes && <p className="text-[10px] text-gray-500 italic">"{item.notes}"</p>}
                      </div>
                      <span className="font-mono text-gray-900 font-semibold">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Total & Actions */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 text-xs font-semibold">Total Pembayaran:</span>
                  <span className="font-black font-mono text-amber-800 text-base">
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
                      className="flex-1 gradient-gold text-white font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Terima Cash</span>
                    </button>
                  )}

                  <button
                    onClick={() => setReceiptOrder(order)}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl text-xs font-extrabold flex items-center gap-1 border border-amber-300 transition"
                    title="Cetak Struk"
                  >
                    <Printer className="w-4 h-4 text-amber-700" />
                    <span className="hidden sm:inline">Struk</span>
                  </button>

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1 shadow-md transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Tandai Selesai</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* CASH PAYMENT VERIFICATION MODAL */}
      {cashModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-amber-500/30 text-gray-900 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Pembayaran Tunai Kasir
              </h3>
              <button onClick={() => setCashModalOrder(null)} className="text-gray-400 hover:text-gray-900 font-bold p-1">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-500/20 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Nota: <strong className="font-mono text-amber-800">{cashModalOrder.orderNumber}</strong></span>
                  <span className="font-black text-amber-900">Meja {cashModalOrder.tableNumber}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1">
                  <span>Total Tagihan:</span>
                  <span className="text-amber-800 font-mono text-base font-black">
                    {formatRupiah(cashModalOrder.total)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-gray-800 block mb-1">Uang Tunai Diterima (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-amber-700 font-black font-mono text-base pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    placeholder="0"
                    value={cashReceived}
                    onChange={e => setCashReceived(formatRupiahInput(e.target.value))}
                    className="w-full bg-white border border-amber-500/30 rounded-2xl pl-10 pr-4 py-3 text-base font-black font-mono text-amber-900 text-right focus:outline-none focus:border-amber-600 shadow-sm"
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
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
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-2xl text-[11px] font-bold text-amber-900 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Kembalian Calculation */}
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-500/20 flex justify-between items-center">
                <span className="text-gray-700 font-bold">Uang Kembalian:</span>
                <span className={`font-mono text-lg font-black ${isEnoughCash ? 'text-emerald-700' : 'text-red-600'}`}>
                  {isEnoughCash ? formatRupiah(changeAmount) : 'Uang Kurang!'}
                </span>
              </div>
            </div>

            <button
              disabled={!isEnoughCash}
              onClick={handleConfirmCashPayment}
              className={`w-full py-4 rounded-2xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                isEnoughCash
                  ? 'gradient-gold text-white shadow-amber-600/25'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
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
