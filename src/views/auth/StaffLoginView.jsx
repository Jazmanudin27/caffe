import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, Coffee, AlertCircle, ArrowRight, User } from 'lucide-react';

export default function StaffLoginView({ targetView, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      // Password check
      const isValidPass = cleanPass === '123' || cleanPass === '1234' || cleanPass === 'admin' || cleanPass === 'kasir' || cleanPass === 'dapur' || cleanPass.length >= 3;

      if (!isValidPass) {
        setError('Password / PIN salah! Gunakan PIN default: 1234');
        setIsLoading(false);
        return;
      }

      // Auto-detect Role & Display Name from Credentials / Database
      let detectedRole = 'cashier';
      let displayName = 'Kasir Utama';

      if (cleanUser.includes('admin') || cleanUser === '1111') {
        detectedRole = 'admin';
        displayName = 'Administrator';
      } else if (cleanUser.includes('dapur') || cleanUser.includes('kitchen') || cleanUser.includes('barista') || cleanUser === '3333') {
        detectedRole = 'kitchen';
        displayName = 'Barista & Dapur';
      } else if (cleanUser.includes('kasir') || cleanUser.includes('cashier') || cleanUser === '2222') {
        detectedRole = 'cashier';
        displayName = 'Kasir POS';
      } else {
        // Fallback role based on targetView if accessing directly
        detectedRole = targetView || 'cashier';
        displayName = username.trim();
      }

      const staffData = {
        id: 'staf-' + Date.now(),
        name: displayName,
        username: username.trim(),
        role: detectedRole,
        loggedInAt: new Date().toISOString()
      };

      localStorage.setItem('caffe_staff_user', JSON.stringify(staffData));
      setIsLoading(false);
      onLoginSuccess(staffData, detectedRole);
    }, 600);
  };

  const handleQuickRoleLogin = (roleId) => {
    let u = roleId === 'admin' ? 'admin' : roleId === 'kitchen' ? 'dapur' : 'kasir';
    let p = '1234';

    setUsername(u);
    setPassword(p);

    setTimeout(() => {
      const staffData = {
        id: 'staf-' + Date.now(),
        name: roleId === 'admin' ? 'Administrator' : roleId === 'kitchen' ? 'Barista & Dapur' : 'Kasir POS',
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

      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl relative z-10">
        
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
              Masukkan Username dan Password Anda. Sistem akan otomatis mendeteksi Role Akses Anda.
            </p>
          </div>
        </div>

        {/* Unified Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-extrabold text-slate-300 uppercase tracking-wider block text-[11px]">
              Username / Email / Kode Staf
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Contoh: admin / kasir / dapur"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner transition"
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
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner transition"
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
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition transform active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span>Memeriksa Akun...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk Ke Sistem</span>
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
              className="py-2.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-[10px] font-black text-amber-300 transition active:scale-95"
            >
              Demo Kasir
            </button>
            <button
              onClick={() => handleQuickRoleLogin('kitchen')}
              className="py-2.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-[10px] font-black text-blue-300 transition active:scale-95"
            >
              Demo Dapur
            </button>
            <button
              onClick={() => handleQuickRoleLogin('admin')}
              className="py-2.5 px-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-[10px] font-black text-purple-300 transition active:scale-95"
            >
              Demo Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

