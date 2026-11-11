import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Calendar as CalendarIcon, Clock, Play } from 'lucide-react';

export default function CalendarView({ selectedDate, onOpenLab, onOpenResult }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getAssignments();
      setAssignments(data);
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  const handleStart = async (assignment) => {
    try {
      const sub = await api.startSubmission(assignment.id);
      if (sub.status === 'SUBMITTED' || sub.status === 'GRADED') {
        onOpenResult(sub.id);
      } else {
        onOpenLab(assignment, sub.id);
      }
    } catch (_) {}
  };

  const scheduleDates = [
    { day: 7, date: '07 Noyabr, 2026', time: '10:00 - 11:30' },
    { day: 15, date: '15 Noyabr, 2026', time: '14:00 - 15:30' },
    { day: 21, date: '21 Noyabr, 2026', time: '09:00 - 10:30' },
    { day: 28, date: '28 Noyabr, 2026', time: '11:00 - 12:30' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-extrabold text-xl text-[#0F172A]">Amaliy Mashg‘ulotlar Rejasi</h3>
            <p className="text-xs text-slate-400 mt-1">
              {selectedDate ? `${selectedDate}-noyabr kuni uchun rejalashtirilgan darslar` : 'Haqiqiy topshiriqlar va muddatlar taqvimi'}
            </p>
          </div>
          <span className="text-xs font-bold text-[#545AE8] px-3 py-1.5 rounded-xl bg-[#EEF2F8]">
            Noyabr 2026
          </span>
        </div>

        <div className="space-y-3">
          {assignments.map((assign, idx) => {
            const scheduleInfo = scheduleDates[idx % scheduleDates.length];
            const isHighlighted = selectedDate && scheduleInfo.day === selectedDate;

            return (
              <div
                key={assign.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isHighlighted
                    ? 'border-[#545AE8] bg-indigo-50/30'
                    : 'border-slate-100 hover:border-[#545AE8]/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2F8] text-[#545AE8] flex items-center justify-center font-bold shrink-0">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F172A]">{assign.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{scheduleInfo.date} | {scheduleInfo.time}</span>
                      </span>
                      <span className="font-bold text-[#545AE8]">{assign.course_code}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                    {assign.lab_type === 'NETWORK_LAB'
                      ? 'Network Lab'
                      : assign.lab_type === 'DATABASE_LAB'
                      ? 'SQL Lab'
                      : assign.lab_type === 'MATH_LAB'
                      ? 'Math Lab'
                      : 'Code Lab'}
                  </span>
                  <button
                    onClick={() => handleStart(assign)}
                    className="bg-[#545AE8] hover:bg-[#4349D6] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Kirish</span>
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
