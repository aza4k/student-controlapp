import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Download, Sparkles, CheckCircle2, ChevronRight, X, Search, Clock, ExternalLink, Activity } from 'lucide-react';

export default function SubmissionsView({ user, onOpenResult }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradeError, setGradeError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const data = await api.getTeacherSubmissions();
      setSubmissions(data);
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (sub) => {
    setActiveSub(sub);
    setGradeError('');
    setGradeInput(sub.teacher_grade !== null ? String(sub.teacher_grade) : '');
    setFeedbackInput(sub.teacher_feedback || '');
  };

  const handleSaveGrade = async () => {
    setGradeError('');
    if (!gradeInput || isNaN(gradeInput) || Number(gradeInput) < 0 || Number(gradeInput) > 100) {
      setGradeError('0 dan 100 gacha to‘g‘ri ball kiriting');
      return;
    }

    setIsGrading(true);
    try {
      await api.gradeSubmission(activeSub.id, gradeInput, feedbackInput);
      setActiveSub(null);
      loadSubmissions();
    } catch (err) {
      setGradeError(err.message);
    } finally {
      setIsGrading(false);
    }
  };

  const handleExport = async () => {
    try {
      await api.exportGradesCSV();
    } catch (_) {}
  };

  const filtered = submissions.filter((s) => {
    const name = s.student?.full_name || s.student?.username || '';
    const task = s.assignment?.title || '';
    return name.toLowerCase().includes(search.toLowerCase()) || task.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Talaba yoki topshiriqni qidirish..."
            className="w-full bg-white rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#0F172A] border border-slate-200 focus:outline-none focus:border-[#545AE8]"
          />
        </div>

        {user?.role === 'TEACHER' && (
          <button
            onClick={handleExport}
            className="bg-white hover:bg-slate-50 text-[#545AE8] border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>HEMIS Eksport (CSV)</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-100">
            Topshirilgan amaliyotlar topilmadi
          </div>
        ) : (
          filtered.map((sub) => {
            const isGraded = sub.status === 'GRADED' && sub.teacher_grade !== null;

            return (
              <div
                key={sub.id}
                onClick={() => handleOpenReview(sub)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-[#545AE8]/40 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#EEF2F8] text-[#545AE8] font-black flex items-center justify-center">
                    {(sub.student?.full_name || sub.student?.username || 'T')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#0F172A]">
                        {sub.student?.full_name || sub.student?.username}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {sub.student?.group_name || 'SE-23'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{sub.assignment?.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Progress</span>
                    <span className="font-extrabold text-[#545AE8]">{sub.ai_progress_percent}%</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Xatolar</span>
                    <span className="font-extrabold text-[#F59E0B]">{sub.ai_errors_count} ta</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Vaqt</span>
                    <span className="font-bold text-slate-600">
                      {Math.floor((sub.work_time_seconds || 0) / 60)} daq
                    </span>
                  </div>

                  <div className="text-right min-w-28">
                    {isGraded ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{sub.teacher_grade} ball</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-600 text-xs font-bold border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Kutilmoqda</span>
                      </span>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeSub && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-[#0F172A]">
                  {activeSub.student?.full_name || activeSub.student?.username} ishi
                </h3>
                <p className="text-xs text-slate-500">{activeSub.assignment?.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenResult && (
                  <button
                    onClick={() => {
                      const id = activeSub.id;
                      setActiveSub(null);
                      onOpenResult(id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#545AE8] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Batafsil sahifa</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveSub(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-[#EEF2F8] rounded-2xl p-5 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#545AE8] font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Tahliliy Hisoboti</span>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg">
                  {activeSub.ai_functional_status}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {activeSub.ai_summary || 'AI hisoboti mavjud emas.'}
              </p>
            </div>

            {(activeSub.final_state?.code || activeSub.final_state?.query) && (
              <div className="bg-slate-900 rounded-2xl p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-48">
                <div className="text-[10px] text-slate-400 mb-1.5 uppercase font-sans font-bold">
                  Yakuniy Kod / So‘rov:
                </div>
                <pre className="whitespace-pre-wrap">
                  {activeSub.final_state.code || activeSub.final_state.query}
                </pre>
              </div>
            )}

            {activeSub.activity_logs?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Activity className="w-3.5 h-3.5 text-[#545AE8]" />
                  <span>So‘nggi Harakatlar ({activeSub.activity_logs.length} ta)</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {activeSub.activity_logs.slice(-6).map((log) => (
                    <div
                      key={log.id}
                      className={`px-3 py-2 rounded-xl text-[11px] flex items-center justify-between border ${
                        log.is_error
                          ? 'bg-red-50 border-red-100 text-red-700'
                          : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-medium truncate mr-2">
                        <strong className="text-[#545AE8]">{log.target_device}:</strong> {log.details}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{log.action_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user?.role === 'TEACHER' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                {gradeError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                    {gradeError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yakuniy Ball (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    placeholder="90"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-base font-black text-[#545AE8] focus:outline-none focus:border-[#545AE8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ustoz Izohi
                  </label>
                  <textarea
                    rows="2"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Talaba ishiga izoh yozing..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#545AE8]"
                  />
                </div>

                <button
                  onClick={handleSaveGrade}
                  disabled={isGrading}
                  className="w-full bg-[#545AE8] hover:bg-[#4349D6] text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isGrading ? 'Saqlanmoqda...' : 'Bahoni Tasdiqlash'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
