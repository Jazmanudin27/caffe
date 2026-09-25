import React from 'react';
import { X, Printer, CheckCircle, Coffee } from 'lucide-react';

export default function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden font-mono text-sm border border-gray-200">
        
        {/* Actions Bar (No-print) */}
        <div className="bg-gray-900 text-white p-3 flex justify-between items-center print:hidden">
          <span className="text-xs font-sans text-gray-300">Struk Pembayaran / Resi</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-gray-950 px-3 py-1 rounded-lg text-xs font-semibold font-sans transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Resi
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Struk Body */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
            <div className="flex justify-center items-center gap-1 font-bold text-lg font-sans text-amber-700">
              <Coffee className="w-5 h-5" /> CAFFE POS
            </div>
            <p className="text-xs text-gray-500">Jl. Kopi Harapan No. 8, Jakarta</p>
            <p className="text-xs text-gray-500">Telp: 0812-3456-7890</p>
          </div>

          <div className="text-xs space-y-1 pb-3 border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">No. Nota:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal:</span>
              <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Meja:</span>
              <span className="font-bold text-amber-700">{order.tableNumber}</span>
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
                  <span>Rp {(item.subtotal).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.quantity} x Rp {item.unitPrice.toLocaleString('id-ID')}</span>
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
              <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Pajak (PB1 10%)</span>
              <span>Rp {order.tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-300">
              <span>TOTAL</span>
              <span className="text-amber-700">Rp {order.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 text-gray-600">
              <span>Metode Pembayaran</span>
              <span className="uppercase font-semibold">{order.paymentMethod}</span>
            </div>
            {order.amountPaid && (
              <>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Tunai / Bayar</span>
                  <span>Rp {Number(order.amountPaid).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Kembalian</span>
                  <span>Rp {Number(order.changeAmount || 0).toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-4 border-t border-dashed border-gray-300 space-y-1">
            <div className="inline-flex items-center gap-1 text-emerald-600 text-xs font-sans font-bold">
              <CheckCircle className="w-3.5 h-3.5" /> LUNAS / TERBAYAR
            </div>
            <p className="text-[11px] text-gray-400 italic">Terima kasih atas kunjungan Anda!</p>
            <p className="text-[10px] text-gray-400">Powered by CaffePOS QR System</p>
          </div>
        </div>

      </div>
    </div>
  );
}
