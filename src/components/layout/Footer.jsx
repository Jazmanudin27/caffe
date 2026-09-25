import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-gray-950/80 py-4 px-4 text-center text-xs text-gray-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>&copy; 2026 CaffePOS System. Full-stack QR Order & Cashier System.</span>
        <div className="flex items-center gap-3 text-amber-400 font-mono text-[11px]">
          <span>caffe.aspartech.com</span> • <span>/kasir</span> • <span>/dapur</span> • <span>/admin</span>
        </div>
      </div>
    </footer>
  );
}
