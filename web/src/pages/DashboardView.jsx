import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ArrowRight, Eye, Play, RotateCcw } from 'lucide-react';

export default function DashboardView({ user, onSelectStudent, onOpenLab, onOpenResult, onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subs, assigns] = await Promise.all([
        api.getTeacherSubmissions(),
        api.getAssignments(),
      ]);
      setSubmissions(subs);
      setAssignments(assigns);
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  const handleStartLab = async (assignment, reopen = false) => {
    try {
      const sub = await api.startSubmission(assignment.id, reopen);
      if (!reopen && (sub.status === 'SUBMITTED' || sub.status === 'GRADED')) {
        onOpenResult(sub.id);
      } else {
        onOpenLab(assignment, sub.id);
      }
    } catch (_) {}
  };

  const pendingCount = submissions.filter((s) => s.status === 'SUBMITTED').length;

  return (
    <div className="space-y-6">
      <div className="bg-[#545AE8] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-md">
        <div className="relative z-10 max-w-md space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Assalomu alaykum, {user.full_name || user.username}!
          </h2>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
            {user.role === 'TEACHER'
              ? `Bugun sizda ${pendingCount} ta tekshirilishi kerak bo‘lgan amaliyot mavjud. AI barcha xatolarni tahlil qilib qo‘ydi.`
              : "Amaliyotlarni to'g'ridan-to'g'ri virtual labda bajaring. AI sizning harakatingizni tahlil qilib boradi."}
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                if (user.role === 'TEACHER') {
                  onNavigate && onNavigate('submissions');
                } else if (assignments.length > 0) {
                  handleStartLab(assignments[0]);
                }
              }}
              className="bg-[#FDB528] hover:bg-[#e5a220] text-[#0F172A] font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{user.role === 'TEACHER' ? 'Hisobotlarni ko‘rish' : 'Amaliyotni boshlash'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-6 md:mt-0">
          <svg className="w-64 h-44 drop-shadow-lg" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="150" cy="100" r="80" fill="#6970F2" opacity="0.6"/>
            <rect x="50" y="140" width="200" height="12" rx="4" fill="#3D42C4"/>
            <rect x="70" y="152" width="10" height="35" rx="3" fill="#2E33A8"/>
            <rect x="220" y="152" width="10" height="35" rx="3" fill="#2E33A8"/>
            <rect x="120" y="95" width="60" height="40" rx="4" fill="#0F172A"/>
            <rect x="125" y="100" width="50" height="30" rx="2" fill="#38BDF8"/>
            <polygon points="110,138 190,138 185,142 115,142" fill="#CBD5E1"/>
            <circle cx="85" cy="85" r="14" fill="#FBBF24"/>
            <path d="M70 135 C70 105, 100 105, 100 135" fill="#F43F5E"/>
            <circle cx="215" cy="80" r="14" fill="#FBBF24"/>
            <path d="M200 135 C200 100, 230 100, 230 135" fill="#06B6D4"/>
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#0F172A]">Amaliyotlar Progressi</h3>
          <button
            onClick={() => onNavigate && onNavigate(user.role === 'TEACHER' ? 'submissions' : 'labs')}
            className="bg-[#545AE8] hover:bg-[#4349D6] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Barchasi
          </button>
        </div>

        <div className="grid grid-cols-12 px-6 py-2 text-xs font-bold text-[#64748B]">
          <div className="col-span-5">Talaba / Topshiriq</div>
          <div className="col-span-3">Yo‘nalish</div>
          <div className="col-span-2">Holat</div>
          <div className="col-span-2 text-right">Amal</div>
        </div>

        <div className="space-y-2.5">
          {user.role === 'TEACHER' ? (
            submissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400">
                Topshiriqlar topilmadi
              </div>
            ) : (
              submissions.map((sub, idx) => {
                const colors = [
                  { bg: 'bg-[#FEE2E2]', text: 'text-[#EF4444]' },
                  { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
                  { bg: 'bg-[#E0E7FF]', text: 'text-[#4F46E5]' },
                  { bg: 'bg-[#D1FAE5]', text: 'text-[#059669]' },
                ];
                const tagColor = colors[idx % colors.length];
                const isGraded = sub.status === 'GRADED' && sub.teacher_grade !== null;

                return (
                  <div
                    key={sub.id}
                    onClick={() => onSelectStudent && onSelectStudent(sub.student)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-[#545AE8]/40 transition-all cursor-pointer grid grid-cols-12 items-center"
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#EEF2F8] text-[#545AE8] font-bold flex items-center justify-center shrink-0">
                        {(sub.student?.full_name || sub.student?.username || 'T')[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#0F172A] truncate">
                          {sub.student?.full_name || sub.student?.username}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                          {sub.assignment?.title}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-bold ${tagColor.bg} ${tagColor.text}`}>
                        {sub.assignment?.lab_type === 'NETWORK_LAB'
                          ? 'Network Lab'
                          : sub.assignment?.lab_type === 'DATABASE_LAB'
                          ? 'SQL Lab'
                          : 'Code Lab'}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${isGraded ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                      <span className="font-semibold text-[#1E293B]">
                        {isGraded ? `${sub.teacher_grade} ball` : 'Tekshiruvda'}
                      </span>
                    </div>

                    <div className="col-span-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenResult(sub.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#EEF2F8] hover:bg-[#545AE8] text-[#545AE8] hover:text-white text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ko‘rish</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            assignments.map((assign, idx) => {
              const colors = [
                { bg: 'bg-[#FEE2E2]', text: 'text-[#EF4444]' },
                { bg: 'bg-[#E0E7FF]', text: 'text-[#4F46E5]' },
                { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
                { bg: 'bg-[#D1FAE5]', text: 'text-[#059669]' },
              ];
              const tagColor = colors[idx % colors.length];
              const mySub = submissions.find((s) => s.assignment?.id === assign.id);
              const isDone = mySub && (mySub.status === 'SUBMITTED' || mySub.status === 'GRADED');

              return (
                <div
                  key={assign.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-[#545AE8]/40 transition-all grid grid-cols-12 items-center"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#EEF2F8] text-[#545AE8] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#0F172A] truncate">{assign.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{assign.course_code}</div>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-bold ${tagColor.bg} ${tagColor.text}`}>
                      {assign.lab_type === 'NETWORK_LAB'
                        ? 'Cisco Packet'
                        : assign.lab_type === 'DATABASE_LAB'
                        ? 'SQLite DB'
                        : 'Python 3'}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${
                      mySub?.status === 'GRADED'
                        ? 'bg-[#10B981]'
                        : isDone
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#3B82F6]'
                    }`} />
                    <span className="font-medium text-[#1E293B]">
                      {mySub?.status === 'GRADED'
                        ? `${mySub.teacher_grade} ball`
                        : isDone
                        ? 'Topshirilgan'
                        : 'Mavjud'}
                    </span>
                  </div>

                  <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                    {isDone && (
                      <button
                        onClick={() => handleStartLab(assign, true)}
                        title="Qayta bajarish"
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleStartLab(assign, false)}
                      className="px-3 py-1.5 rounded-xl bg-[#545AE8] hover:bg-[#4349D6] text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {isDone ? 'Hisobot' : 'Boshlash'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
