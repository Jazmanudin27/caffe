import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-amber-500/15 bg-white/90 backdrop-blur-md py-4 px-4 text-center text-xs text-gray-600">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>&copy; 2026 CaffePOS System. Full-stack QR Order & Cashier System.</span>
        <div className="flex items-center gap-3 text-amber-700 font-bold font-mono text-[11px]">
          <span>caffe.aspartech.com</span> • <span>/kasir</span> • <span>/dapur</span> • <span>/admin</span>
        </div>
      </div>
    </footer>
  );
}
