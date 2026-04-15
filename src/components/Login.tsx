import React from 'react';
import { LayoutDashboard, LogIn, ShieldCheck, Zap } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <div className="p-10 text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-slate-200 rotate-3 hover:rotate-0 transition-transform duration-500">
                <LayoutDashboard className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">RetailCore</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Intelligence System</p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Real-time Analytics</p>
                  <p className="text-[10px] text-slate-500 font-medium">Live KPI tracking and sales insights</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Secure Access</p>
                  <p className="text-[10px] text-slate-500 font-medium">Role-based permissions and audit logs</p>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="space-y-4 pt-4">
              <button 
                onClick={handleLogin}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </button>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Authorized Personnel Only
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              RetailCore Enterprise v2.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
