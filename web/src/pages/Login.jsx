import React, { useState } from 'react';
import { api } from '../api';
import { ArrowRight, User, Lock, Zap } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('student_024');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username || !password) {
      setError('Login va parolni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Kirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#EEF2F8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#545AE8] text-[#FDB528] flex items-center justify-center shadow-md">
            <Zap className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">FunDev Practical Lab</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Virtual Practical Learning Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Foydalanuvchi Nomi</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="student_024 yoki teacher_01"
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Parol</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#545AE8] hover:bg-[#4349D6] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
          >
            <span>{loading ? 'Kirilmoqda...' : 'Tizimga kirish'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 text-center mb-3">
            Tezkor test hisoblari:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('student_024', 'student123')}
              className="p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2F8] border border-slate-200 text-center cursor-pointer transition-colors"
            >
              <div className="text-xs font-bold text-[#545AE8]">Talaba Aziz</div>
              <div className="text-[9px] text-slate-400">SE-23</div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('student_025', 'student123')}
              className="p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2F8] border border-slate-200 text-center cursor-pointer transition-colors"
            >
              <div className="text-xs font-bold text-amber-600">Talaba Vali</div>
              <div className="text-[9px] text-slate-400">Yangi ish</div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('teacher_01', 'teacher123')}
              className="p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2F8] border border-slate-200 text-center cursor-pointer transition-colors"
            >
              <div className="text-xs font-bold text-emerald-600">Ustoz</div>
              <div className="text-[9px] text-slate-400">O'qituvchi</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
