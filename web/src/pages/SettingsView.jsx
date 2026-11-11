import React, { useState } from 'react';
import { api } from '../api';
import { User, KeyRound, Check, AlertCircle } from 'lucide-react';

export default function SettingsView({ user, onProfileUpdated }) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await api.updateProfile({
        full_name: fullName,
        email: email,
        new_password: newPassword || undefined,
      });
      setSaved(true);
      setMsg('Profil ma‘lumotlari muvaffaqiyatli saqlandi!');
      if (onProfileUpdated) onProfileUpdated(res.user);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setMsg(`Xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
      <div>
        <h3 className="font-extrabold text-xl text-[#0F172A]">Profil va Tizim Sozlamalari</h3>
        <p className="text-xs text-slate-400 mt-1">Shaxsiy ma‘lumotlar va xavfsizlik parametrlari</p>
      </div>

      {msg && (
        <div className={`p-3 rounded-2xl text-xs font-semibold ${saved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">To‘liq Ism-sharif</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Elektron Pochta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="misol@fundev.uz"
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Foydalanuvchi Nomi (Login)</label>
          <input
            type="text"
            value={user?.username || ''}
            disabled
            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Yangi Parol (O‘zgartirish uchun)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Kamida 6 ta belgi (ixtiyoriy)"
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#545AE8] hover:bg-[#4349D6] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            <span>{loading ? 'Saqlanmoqda...' : 'O‘zgarishlarni Saqlash'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
