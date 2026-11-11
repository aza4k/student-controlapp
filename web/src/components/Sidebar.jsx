import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  FileCheck2,
  CalendarDays,
  Settings,
  LogOut,
  Zap,
  GraduationCap
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'labs', label: 'Laboratoriyalar', icon: Cpu },
    { id: 'submissions', label: 'Hisobotlar', icon: FileCheck2 },
    { id: 'calendar', label: 'Kalendar', icon: CalendarDays },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#545AE8] text-white flex flex-col justify-between shrink-0 p-6 min-h-screen">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-[#FDB528] flex items-center justify-center text-[#545AE8] shadow-md">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-2xl tracking-tight">FunDev</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#545AE8] shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#545AE8]' : 'text-white/80'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-3xl p-4 text-center text-[#1E293B] shadow-lg relative overflow-hidden">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-[#EEF2F8] flex items-center justify-center text-[#545AE8]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-xs text-[#0F172A]">AI Virtual Lab</h4>
          <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
            Avtomatik Activity Log va xolis tahlil tizimi
          </p>
          <div className="mt-3 py-1.5 px-3 bg-[#EEF2F8] rounded-xl text-[10px] font-bold text-[#545AE8]">
            v2.4 Production
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Tizimdan chiqish</span>
        </button>
      </div>
    </aside>
  );
}
