import React, { useState } from 'react';
import { Database, Table, Key, Link2, Copy, Check, Shield, FileText } from 'lucide-react';

export default function DatabaseSchemaView() {
  const [copied, setCopied] = useState(false);

  const tablesList = [
    {
      name: 'tables (Meja Cafe)',
      columns: [
        { name: 'id', type: 'VARCHAR(36)', key: 'PK', desc: 'UUID Meja' },
        { name: 'table_number', type: 'VARCHAR(20)', key: 'UNIQUE', desc: 'Nomor Meja (e.g. M-01)' },
        { name: 'qr_code_token', type: 'VARCHAR(100)', key: 'UNIQUE', desc: 'Token QR unik' },
        { name: 'capacity', type: 'INT', key: '', desc: 'Kapasitas Tempat Duduk' },
        { name: 'status', type: 'VARCHAR(20)', key: '', desc: 'available / occupied' },
      ]
    },
    {
      name: 'products (Menu Caffe)',
      columns: [
        { name: 'id', type: 'VARCHAR(36)', key: 'PK', desc: 'UUID Produk' },
        { name: 'category_id', type: 'VARCHAR(36)', key: 'FK', desc: 'Relasi ke categories.id' },
        { name: 'name', type: 'VARCHAR(100)', key: '', desc: 'Nama Kopi / Makanan' },
        { name: 'price', type: 'DECIMAL(12,2)', key: '', desc: 'Harga Dasar' },
        { name: 'is_available', type: 'BOOLEAN', key: '', desc: 'Status Stok' },
      ]
    },
    {
      name: 'product_variants (Varian & Add-ons)',
      columns: [
        { name: 'id', type: 'VARCHAR(36)', key: 'PK', desc: 'UUID Varian' },
        { name: 'product_id', type: 'VARCHAR(36)', key: 'FK', desc: 'Relasi ke products.id' },
        { name: 'variant_group', type: 'VARCHAR(50)', key: '', desc: 'Temperature, Sugar, Topping' },
        { name: 'variant_name', type: 'VARCHAR(50)', key: '', desc: 'Hot / Ice / Less Sugar' },
        { name: 'extra_price', type: 'DECIMAL(10,2)', key: '', desc: 'Tambahan Harga (+Rp 5.000)' },
      ]
    },
    {
      name: 'orders (Pesanan Meja)',
      columns: [
        { name: 'id', type: 'VARCHAR(36)', key: 'PK', desc: 'UUID Order' },
        { name: 'order_number', type: 'VARCHAR(30)', key: 'UNIQUE', desc: 'No Nota (ORD-2026...)' },
        { name: 'table_id', type: 'VARCHAR(36)', key: 'FK', desc: 'Relasi ke tables.id' },
        { name: 'customer_name', type: 'VARCHAR(100)', key: '', desc: 'Nama Pelanggan' },
        { name: 'status', type: 'VARCHAR(20)', key: '', desc: 'pending_payment, preparing, ready, completed' },
        { name: 'total_amount', type: 'DECIMAL(12,2)', key: '', desc: 'Total Akhir Tagihan' },
      ]
    },
    {
      name: 'payments (Transaksi Pembayaran)',
      columns: [
        { name: 'id', type: 'VARCHAR(36)', key: 'PK', desc: 'UUID Pembayaran' },
        { name: 'order_id', type: 'VARCHAR(36)', key: 'FK', desc: 'Relasi ke orders.id' },
        { name: 'payment_method', type: 'VARCHAR(30)', key: '', desc: 'cash, qris, gopay, debit' },
        { name: 'payment_status', type: 'VARCHAR(20)', key: '', desc: 'unpaid, paid, refunded' },
        { name: 'amount_paid', type: 'DECIMAL(12,2)', key: '', desc: 'Jumlah Uang Diterima' },
        { name: 'change_amount', type: 'DECIMAL(12,2)', key: '', desc: 'Uang Kembalian' },
      ]
    }
  ];

  const sqlDDL = `CREATE TABLE tables (
    id VARCHAR(36) PRIMARY KEY,
    table_number VARCHAR(20) NOT NULL UNIQUE,
    qr_code_token VARCHAR(100) NOT NULL UNIQUE,
    capacity INT DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available'
);

CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    table_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(100) DEFAULT 'Guest',
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (table_id) REFERENCES tables(id)
);

CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    amount_paid DECIMAL(12, 2) NOT NULL,
    change_amount DECIMAL(12, 2) DEFAULT 0.00,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlDDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="glass p-5 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            Rancangan Struktur Database (ERD & DDL)
          </h2>
          <p className="text-xs text-gray-400">
            Arsitektur database relational untuk aplikasi POS Caffe berbasis Scan QR Meja & Pembayaran Kasir.
          </p>
        </div>

        <button
          onClick={copySql}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Ter-copy ke Clipboard!' : 'Copy SQL DDL'}</span>
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tablesList.map((tbl, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800 text-amber-400 font-bold text-sm">
              <Table className="w-4 h-4 text-amber-500" />
              <span>{tbl.name}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {tbl.columns.map((col, cIdx) => (
                <div key={cIdx} className="flex justify-between items-center bg-gray-950 p-2 rounded-lg border border-gray-850">
                  <div className="flex items-center gap-2">
                    {col.key === 'PK' && <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">PK</span>}
                    {col.key === 'FK' && <span className="bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">FK</span>}
                    {col.key === 'UNIQUE' && <span className="bg-purple-500/20 text-purple-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30">UQ</span>}
                    <span className="font-mono text-gray-200 font-semibold">{col.name}</span>
                  </div>

                  <span className="text-[10px] text-gray-400 font-mono">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SQL Snippet Viewer */}
      <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" /> Contoh Potongan Script SQL DDL
          </h3>
        </div>
        <pre className="text-xs font-mono text-emerald-400 overflow-x-auto bg-gray-900 p-4 rounded-xl border border-gray-800 leading-relaxed">
          {sqlDDL}
        </pre>
      </div>

    </div>
  );
}
