import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, Coffee, AlertCircle, ArrowRight, ChefHat, Monitor, ShieldAlert, CheckCircle2, User } from 'lucide-react';

export default function StaffLoginView({ targetView, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(targetView || 'cashier'); // 'cashier' | 'kitchen' | 'admin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const rolesConfig = [
    {
      id: 'cashier',
      name: 'Kasir POS',
      desc: 'Pemrosesan pesanan & pembayaran tunai',
      icon: <Monitor className="w-5 h-5 text-amber-500" />,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      id: 'kitchen',
      name: 'Display Dapur',
      desc: 'Pantau antrean pesanan barista & dapur',
      icon: <ChefHat className="w-5 h-5 text-blue-500" />,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    {
      id: 'admin',
      name: 'Administrator',
      desc: 'Kelola produk, harga & laporan omset',
      icon: <ShieldAlert className="w-5 h-5 text-purple-500" />,
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
    }
  ];

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Silakan masukkan Username / Kode Staf');
      return;
    }
    if (!password.trim()) {
      setError('Silakan masukkan Password / PIN Keamanan');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim().toLowerCase();

      // Demo Pass check
      const isValidPass = cleanPass === '123' || cleanPass === '1234' || cleanPass === 'admin' || cleanPass === 'kasir' || cleanPass === 'dapur' || cleanPass.length >= 3;

      if (!isValidPass) {
        setError('Password / PIN salah! Gunakan PIN default: 1234');
        setIsLoading(false);
        return;
      }

      let name = 'Staf Restoran';
      if (selectedRole === 'admin') name = 'Administrator';
      if (selectedRole === 'cashier') name = 'Kasir POS';
      if (selectedRole === 'kitchen') name = 'Barista & Dapur';

      const staffData = {
        id: 'staf-' + Date.now(),
        name: name,
        username: username.trim(),
        role: selectedRole,
        loggedInAt: new Date().toISOString()
      };

      localStorage.setItem('caffe_staff_user', JSON.stringify(staffData));
      setIsLoading(false);
      onLoginSuccess(staffData, selectedRole);
    }, 600);
  };

  const handleQuickRoleLogin = (roleId) => {
    setSelectedRole(roleId);
    let u = roleId === 'admin' ? 'admin' : roleId === 'cashier' ? 'kasir' : 'dapur';
    let p = '1234';

    setUsername(u);
    setPassword(p);

    setTimeout(() => {
      const staffData = {
        id: 'staf-' + Date.now(),
        name: roleId === 'admin' ? 'Administrator' : roleId === 'cashier' ? 'Kasir POS' : 'Barista & Dapur',
        username: u,
        role: roleId,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('caffe_staff_user', JSON.stringify(staffData));
      onLoginSuccess(staffData, roleId);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl relative z-10">
        
        {/* Portal Header Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-700/60 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              P
            </div>
            <div className="text-left">
              <h1 className="font-extrabold text-sm text-white tracking-wider font-heading leading-tight">
                PORTAL <span className="text-blue-400">CAFFE POS</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">System Restoran & POS Multi-Role</p>
            </div>
          </div>

          <div className="pt-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Masuk Sesi Staf Restoran
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pilih Role Pengguna dan masukkan kredensial untuk mengakses sistem.
            </p>
          </div>
        </div>

        {/* Role Selector Cards */}
        <div className="space-y-2">
          <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
            1. Pilih Role Akses Pengguna:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {rolesConfig.map(role => {
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    {role.icon}
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-white leading-tight">{role.name}</h3>
                    <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{role.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-extrabold text-slate-300 uppercase tracking-wider block text-[11px]">
              2. Username / Kode Staf
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder={`Contoh: ${selectedRole}`}
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-extrabold text-slate-300 uppercase tracking-wider block text-[11px]">
              Password / PIN Keamanan
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="Default PIN: 1234"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner transition"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs flex items-center gap-2 font-bold animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Memeriksa Akun...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk Ke Dashboard ({rolesConfig.find(r => r.id === selectedRole)?.name})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Presets */}
        <div className="pt-3 border-t border-slate-700/60 space-y-2 text-center">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Login Cepat Demo Staf:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickRoleLogin('cashier')}
              className="py-2 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-[10px] font-black text-amber-300 transition active:scale-95"
            >
              Role Kasir
            </button>
            <button
              onClick={() => handleQuickRoleLogin('kitchen')}
              className="py-2 px-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-[10px] font-black text-blue-300 transition active:scale-95"
            >
              Role Dapur
            </button>
            <button
              onClick={() => handleQuickRoleLogin('admin')}
              className="py-2 px-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-[10px] font-black text-purple-300 transition active:scale-95"
            >
              Role Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
