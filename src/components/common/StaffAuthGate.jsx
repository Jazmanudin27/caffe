import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, Coffee, AlertCircle, ArrowRight, UserCheck, ChefHat, Monitor, ShieldAlert } from 'lucide-react';

export default function StaffAuthGate({ requiredRole, targetView, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const viewTitles = {
    cashier: { title: 'Kasir POS & Pembayaran', roleName: 'Kasir / Admin', icon: <Monitor className="w-6 h-6 text-amber-400" /> },
    kitchen: { title: 'Display Dapur & Barista', roleName: 'Dapur / Barista', icon: <ChefHat className="w-6 h-6 text-blue-400" /> },
    admin: { title: 'Admin Control Panel', roleName: 'Administrator', icon: <ShieldAlert className="w-6 h-6 text-purple-400" /> }
  };

  const currentViewInfo = viewTitles[targetView] || { title: 'Halaman Staf Restoran', roleName: 'Staf Restoran', icon: <Lock className="w-6 h-6 text-amber-400" /> };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Masukkan Username / Kode Staf Anda');
      return;
    }
    if (!password.trim()) {
      setError('Masukkan Password / PIN Keamanan');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim().toLowerCase();

      // Demo/Default Auth Verification
      let role = 'staff';
      let name = 'Staf Restoran';

      if (cleanUser.includes('admin') || cleanUser === '1111') {
        role = 'admin';
        name = 'Administrator';
      } else if (cleanUser.includes('kasir') || cleanUser.includes('cashier') || cleanUser === '2222') {
        role = 'cashier';
        name = 'Kasir Utama';
      } else if (cleanUser.includes('dapur') || cleanUser.includes('barista') || cleanUser === '3333') {
        role = 'kitchen';
        name = 'Barista & Dapur';
      } else {
        role = 'staff';
        name = username.trim();
      }

      // Check simple password matching or default pin '123' / '1234' / 'admin'
      const isValidPass = cleanPass === '123' || cleanPass === '1234' || cleanPass === 'admin' || cleanPass === 'kasir' || cleanPass === 'dapur' || cleanPass.length >= 3;

      if (!isValidPass) {
        setError('Password / PIN salah! Gunakan default PIN: 1234');
        setIsLoading(false);
        return;
      }

      const staffData = {
        id: 'staf-' + Date.now(),
        name: name,
        username: username.trim(),
        role: role,
        loggedInAt: new Date().toISOString()
      };

      localStorage.setItem('caffe_staff_user', JSON.stringify(staffData));
      setIsLoading(false);
      onLoginSuccess(staffData);
    }, 600);
  };

  const handleQuickLogin = (roleType) => {
    let u = 'admin';
    let p = '1234';
    if (roleType === 'cashier') { u = 'kasir'; p = '1234'; }
    if (roleType === 'kitchen') { u = 'dapur'; p = '1234'; }

    setUsername(u);
    setPassword(p);
    
    setTimeout(() => {
      const staffData = {
        id: 'staf-' + Date.now(),
        name: roleType === 'admin' ? 'Administrator' : roleType === 'cashier' ? 'Kasir Utama' : 'Barista Dapur',
        username: u,
        role: roleType,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('caffe_staff_user', JSON.stringify(staffData));
      onLoginSuccess(staffData);
    }, 200);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Decorative Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-950 via-amber-900 to-amber-800 border-2 border-amber-500/40 mx-auto flex items-center justify-center shadow-lg">
            {currentViewInfo.icon}
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            Autentikasi Akses Staf
          </h2>
          <p className="text-xs text-amber-800 font-bold bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300 inline-block">
            {currentViewInfo.title}
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-extrabold text-gray-800 block mb-1 uppercase tracking-wider">
              Username / Kode Staf
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-amber-600 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Contoh: kasir / admin / dapur"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-amber-50/40 border border-amber-500/30 rounded-2xl pl-10 pr-4 py-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition"
              />
            </div>
          </div>

          <div>
            <label className="font-extrabold text-gray-800 block mb-1 uppercase tracking-wider">
              Password / PIN Keamanan
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-600 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="Default PIN: 1234"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-amber-50/40 border border-amber-500/30 rounded-2xl pl-10 pr-4 py-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-2xl text-xs flex items-center gap-2 font-bold animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-amber-600/30 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Memeriksa Akses...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Masuk Ke Halaman {targetView.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Presets */}
        <div className="pt-3 border-t border-amber-100 space-y-2 text-center">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
            Login Cepat Demo Staf:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('cashier')}
              className="py-2 px-2 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 rounded-xl text-[10px] font-black text-amber-900 transition active:scale-95"
            >
              Kasir
            </button>
            <button
              onClick={() => handleQuickLogin('kitchen')}
              className="py-2 px-2 bg-blue-100/80 hover:bg-blue-200 border border-blue-300 rounded-xl text-[10px] font-black text-blue-900 transition active:scale-95"
            >
              Dapur
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="py-2 px-2 bg-purple-100/80 hover:bg-purple-200 border border-purple-300 rounded-xl text-[10px] font-black text-purple-900 transition active:scale-95"
            >
              Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
