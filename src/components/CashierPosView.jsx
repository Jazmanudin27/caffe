import React, { useState } from 'react';
import { 
  Monitor, CheckCircle, Clock, Printer, DollarSign, 
  Search, Filter, Coffee, AlertTriangle, ArrowRight, UserCheck, Plus
} from 'lucide-react';
import ReceiptModal from './ReceiptModal';

export default function CashierPosView({ orders, updateOrderStatus, updateOrderPayment, selectedTable }) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending_payment', 'paid', 'preparing', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment modal state
  const [cashModalOrder, setCashModalOrder] = useState(null);
  const [cashReceived, setCashReceived] = useState('');
  
  // Receipt view state
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Helper functions for Rupiah formatting
  const formatRupiahInput = (val) => {
    if (val === null || val === undefined) return '';
    const numberString = val.toString().replace(/\D/g, '');
    if (!numberString) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numberString, 10));
  };

  const getNumericValue = (val) => {
    if (!val) return 0;
    return parseInt(val.toString().replace(/\D/g, ''), 10) || 0;
  };

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
      status: 'preparing' // Automatically send to kitchen upon payment verification!
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
    setReceiptOrder(updated); // Show receipt right after payment confirmation
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-20">
      
      {/* Cashier Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass p-5 rounded-2xl border border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-amber-500" />
            Dashboard Kasir & Pemrosesan Pembayaran
          </h2>
          <p className="text-xs text-gray-400">
            Kelola transaksi masuk dari QR Code Meja & verifikasi pembayaran tunai di kasir.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl text-amber-400">
            Pending Cash: <strong className="text-white font-mono">{orders.filter(o => o.status === 'pending_payment').length}</strong>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 px-3 py-2 rounded-xl text-blue-400">
            Sedang Diproses: <strong className="text-white font-mono">{orders.filter(o => o.status === 'preparing').length}</strong>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl text-emerald-400">
            Selesai: <strong className="text-white font-mono">{orders.filter(o => o.status === 'completed').length}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            Semua Pesanan ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending_payment')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === 'pending_payment' ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            Menunggu Bayar Cash ({orders.filter(o => o.status === 'pending_payment').length})
          </button>
          <button
            onClick={() => setFilterStatus('preparing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === 'preparing' ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            Proses Dapur ({orders.filter(o => o.status === 'preparing').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === 'completed' ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            Selesai ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari Nota, Meja, Nama..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 glass rounded-2xl">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className={`glass rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                order.status === 'pending_payment'
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : 'border-gray-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start pb-3 border-b border-gray-800">
                  <div>
                    <span className="text-[11px] font-mono text-gray-400">{order.orderNumber}</span>
                    <h3 className="font-bold text-gray-100 text-base">{order.customerName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-amber-500/20 text-amber-400 font-extrabold px-2.5 py-1 rounded-lg text-xs border border-amber-500/30">
                      Meja {order.tableNumber}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 pt-3 text-xs">
                  {order.paymentStatus === 'paid' ? (
                    <span className="badge badge-paid flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Lunas ({order.paymentMethod.toUpperCase()})
                    </span>
                  ) : (
                    <span className="badge badge-pending flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Belum Bayar (Cash)
                    </span>
                  )}

                  {order.status === 'preparing' && <span className="badge badge-preparing">Dapur Menyiapkan</span>}
                  {order.status === 'ready' && <span className="badge badge-ready">Siap Disajikan</span>}
                  {order.status === 'completed' && <span className="badge badge-success">Selesai</span>}
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5 pt-3 text-xs text-gray-300">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-amber-400">{item.quantity}x</span> {item.productName}
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <p className="text-[10px] text-gray-400">({item.selectedVariants.join(', ')})</p>
                        )}
                        {item.notes && <p className="text-[10px] text-amber-300/80">"{item.notes}"</p>}
                      </div>
                      <span className="font-mono text-gray-400">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Total & Actions */}
              <div className="pt-3 border-t border-gray-800 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 text-xs">Total Pembayaran:</span>
                  <span className="font-bold font-mono text-amber-400 text-base">
                    Rp {order.total.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Action 1: Pay Cash Modal */}
                  {order.status === 'pending_payment' && (
                    <button
                      onClick={() => {
                        setCashModalOrder(order);
                        setCashReceived(formatRupiahInput(order.total));
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/30 transition"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Terima Cash</span>
                    </button>
                  )}

                  {/* Action 2: Print Receipt */}
                  <button
                    onClick={() => setReceiptOrder(order)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1 border border-gray-700 transition"
                    title="Cetak Struk"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Struk</span>
                  </button>

                  {/* Action 3: Complete Order manually */}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 text-gray-100 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Pembayaran Tunai Kasir
              </h3>
              <button onClick={() => setCashModalOrder(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-800 p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Nota: {cashModalOrder.orderNumber}</span>
                  <span className="font-bold text-amber-400">Meja {cashModalOrder.tableNumber}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white">
                  <span>Total Tagihan:</span>
                  <span className="text-amber-400 font-mono text-base">
                    Rp {cashModalOrder.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Uang Tunai Diterima (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-amber-400 font-bold font-mono text-base pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    placeholder="0"
                    value={cashReceived}
                    onChange={e => setCashReceived(formatRupiahInput(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-base font-bold font-mono text-amber-400 text-right focus:outline-none focus:border-amber-500 shadow-inner"
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
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-[11px] font-semibold text-gray-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Kembalian Calculation */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400">Uang Kembalian:</span>
                <span className={`font-mono text-lg font-bold ${isEnoughCash ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isEnoughCash ? `Rp ${changeAmount.toLocaleString('id-ID')}` : 'Uang Kurang!'}
                </span>
              </div>
            </div>

            <button
              disabled={!isEnoughCash}
              onClick={handleConfirmCashPayment}
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                isEnoughCash
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
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
