import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ChevronLeft, ChevronRight, Phone, Mail, MessageSquare } from 'lucide-react';

export default function RightPanel({ user, selectedStudent, onFilterByDate }) {
  const [selectedDay, setSelectedDay] = useState(10);
  const [stats, setStats] = useState(null);
  const [activeContactInfo, setActiveContactInfo] = useState(null);
  const targetUser = selectedStudent || user;

  useEffect(() => {
    loadUserStats();
    setActiveContactInfo(null);
  }, [targetUser]);

  const loadUserStats = async () => {
    try {
      const data = await api.getStudentStats(targetUser?.id);
      setStats(data);
    } catch (_) {}
  };

  const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const calendarDays = [
    null, null, 1, 2, 3, 4, 5,
    6, 7, 8, 9, 10, 11, 12,
    13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 26,
    27, 28, 29, 30
  ];

  const handleDayClick = (day) => {
    setSelectedDay(day);
    if (onFilterByDate) onFilterByDate(day);
  };

  return (
    <div className="w-80 shrink-0 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <span className="font-extrabold text-[#0F172A] text-sm">Noyabr, 2026</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDayClick(Math.max(1, selectedDay - 1))}
              className="w-7 h-7 rounded-xl bg-[#EEF2F8] hover:bg-[#E2E8F0] flex items-center justify-center text-[#545AE8] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDayClick(Math.min(30, selectedDay + 1))}
              className="w-7 h-7 rounded-xl bg-[#545AE8] hover:bg-[#4349D6] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-[10px]">
          <div className="bg-[#F8FAFC] rounded-xl p-2 border border-slate-100 flex items-center justify-between">
            <span className="text-slate-400">Tanlangan:</span>
            <span className="font-bold text-[#0F172A]">{selectedDay}.11.2026</span>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-2 border border-slate-100 flex items-center justify-between">
            <span className="text-slate-400">Muddat:</span>
            <span className="font-bold text-[#0F172A]">30.11.2026</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {daysOfWeek.map((d) => (
            <span key={d} className="font-bold text-slate-400 text-[10px] py-1">
              {d}
            </span>
          ))}
          {calendarDays.map((day, idx) => {
            if (!day) return <span key={idx} />;
            const isSelected = day === selectedDay;
            const hasTask = day === 12 || day === 18 || day === 25;

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(day)}
                className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-xs font-semibold transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#545AE8] text-white shadow-sm'
                    : 'text-[#1E293B] hover:bg-[#EEF2F8]'
                }`}
              >
                {day}
                {hasTask && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FDB528] absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#EEF2F8] border-4 border-white shadow-md flex items-center justify-center text-3xl font-black text-[#545AE8] mb-3">
          {(targetUser?.full_name || targetUser?.username || 'U')[0]}
        </div>

        <h3 className="font-black text-lg text-[#0F172A]">
          {targetUser?.full_name || targetUser?.username}
        </h3>
        <p className="text-xs text-[#64748B] mt-0.5 font-medium">
          {targetUser?.role === 'TEACHER' ? 'Kafedra O\'qituvchisi' : `Talaba (${targetUser?.group_name || 'SE-23'})`}
        </p>

        <div className="flex items-center justify-center gap-3 my-4">
          <button
            onClick={() => setActiveContactInfo(activeContactInfo === 'phone' ? null : 'phone')}
            className={`w-10 h-10 rounded-2xl transition-colors flex items-center justify-center cursor-pointer ${
              activeContactInfo === 'phone' ? 'bg-[#545AE8] text-white' : 'bg-[#EEF2F8] text-[#545AE8] hover:bg-[#545AE8] hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveContactInfo(activeContactInfo === 'email' ? null : 'email')}
            className={`w-10 h-10 rounded-2xl transition-colors flex items-center justify-center cursor-pointer ${
              activeContactInfo === 'email' ? 'bg-[#545AE8] text-white' : 'bg-[#EEF2F8] text-[#545AE8] hover:bg-[#545AE8] hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveContactInfo(activeContactInfo === 'chat' ? null : 'chat')}
            className={`w-10 h-10 rounded-2xl transition-colors flex items-center justify-center cursor-pointer ${
              activeContactInfo === 'chat' ? 'bg-[#545AE8] text-white' : 'bg-[#EEF2F8] text-[#545AE8] hover:bg-[#545AE8] hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {activeContactInfo && (
          <div className="mb-4 p-3 rounded-2xl bg-[#EEF2F8] text-[#0F172A] text-xs font-semibold">
            {activeContactInfo === 'phone' && '+998 90 123-45-67'}
            {activeContactInfo === 'email' && (targetUser?.email || `${targetUser?.username}@fundev.uz`)}
            {activeContactInfo === 'chat' && `Guruh: ${targetUser?.group_name || 'SE-23'} | Online`}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-left">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Guruh:</span>
            <span className="font-bold text-[#0F172A]">{stats?.group_name || targetUser?.group_name || 'SE-23'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Topshirilgan:</span>
            <span className="font-bold text-[#0F172A]">{stats?.total_submissions ?? 1} ta amaliyot</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">O'rtacha Ball:</span>
            <span className="font-bold text-[#10B981]">
              {stats?.average_grade ? `${stats.average_grade} / 100` : 'Baholanmagan'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
