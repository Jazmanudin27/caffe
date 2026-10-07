import React from 'react';
import { X, Printer, CheckCircle, Coffee } from 'lucide-react';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

export default function ReceiptModal({ order, onClose, appSettings }) {
  if (!order) return null;

  // Fallback to localStorage if appSettings not passed directly
  const settings = appSettings || (() => {
    try {
      const saved = localStorage.getItem('caffe_app_settings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  })();

  const brandName = settings.appName || 'CAFFE POS';
  const brandAddress = settings.caffeAddress || 'Jl. Kopi Harapan No. 8, Jakarta';
  const brandPhone = settings.caffePhone || '0812-3456-7890';
  const wifiName = settings.wifiName;
  const wifiPassword = settings.wifiPassword;
  const footerNote = settings.receiptFooterNote || 'Terima kasih atas kunjungan Anda!';
  const taxRate = settings.taxRate || 10;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden font-mono text-sm border border-gray-200">
        
        {/* Actions Bar */}
        <div className="bg-gray-900 text-white p-3 flex justify-between items-center print:hidden">
          <span className="text-xs font-sans text-gray-300">Struk Pembayaran / Resi</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-gray-950 px-3 py-1 rounded-lg text-xs font-semibold font-sans transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Resi
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Struk Body */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
            <div className="flex justify-center items-center gap-1 font-bold text-lg font-sans text-amber-700">
              <Coffee className="w-5 h-5" /> {brandName}
            </div>
            <p className="text-xs text-gray-500">{brandAddress}</p>
            {brandPhone && <p className="text-xs text-gray-500">Telp/WA: {brandPhone}</p>}
            {wifiName && (
              <p className="text-[10px] text-amber-800 bg-amber-50 rounded py-0.5 mt-1">
                Wi-Fi: <span className="font-bold">{wifiName}</span> {wifiPassword ? `(Pass: ${wifiPassword})` : ''}
              </p>
            )}
          </div>

          <div className="text-xs space-y-1 pb-3 border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">No. Nota:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal:</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Meja / Tipe:</span>
              <span className="font-bold text-amber-700">
                {order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway'} ({order.orderType === 'takeaway' ? 'Bungkus' : 'Dine-In'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pelanggan:</span>
              <span>{order.customerName || 'Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kasir:</span>
              <span>Kasir #01</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 pb-3 border-b border-dashed border-gray-300">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>{item.productName}</span>
                  <span>{formatRupiah(item.subtotal || (item.quantity * item.unitPrice))}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.quantity} x {formatRupiah(item.unitPrice)}</span>
                </div>
                {item.selectedVariants && item.selectedVariants.length > 0 && (
                  <div className="text-[11px] text-gray-400 italic">
                    ({item.selectedVariants.join(', ')})
                  </div>
                )}
                {item.notes && (
                  <div className="text-[11px] text-amber-800">
                    Catatan: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatRupiah(order.subtotal || 0)}</span>
            </div>
            {order.tax > 0 ? (
              <div className="flex justify-between text-gray-600">
                <span>Pajak (PB1 {taxRate}%)</span>
                <span>{formatRupiah(order.tax)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-300">
              <span>TOTAL</span>
              <span className="text-amber-700">{formatRupiah(order.total)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 text-gray-600">
              <span>Metode Pembayaran</span>
              <span className="uppercase font-semibold">{order.paymentMethod || 'CASH'}</span>
            </div>
            {order.amountPaid && order.amountPaid > 0 ? (
              <>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Tunai / Bayar</span>
                  <span>{formatRupiah(order.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Kembalian</span>
                  <span>{formatRupiah(order.changeAmount || 0)}</span>
                </div>
              </>
            ) : null}
          </div>

          <div className="text-center pt-4 border-t border-dashed border-gray-300 space-y-1">
            <div className="inline-flex items-center gap-1 text-emerald-600 text-xs font-sans font-bold">
              <CheckCircle className="w-3.5 h-3.5" /> {order.paymentStatus === 'paid' || order.status === 'completed' ? 'LUNAS / TERBAYAR' : 'BELUM LUNAS'}
            </div>
            <p className="text-[11px] text-gray-500 italic">{footerNote}</p>
            <p className="text-[10px] text-gray-400">{brandName} QR Order System</p>
          </div>
        </div>

      </div>
    </div>
  );
}
