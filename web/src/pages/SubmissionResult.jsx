import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Sparkles,
  CheckCircle2,
  Hourglass,
  Clock,
  Bug,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  Award,
  RotateCcw
} from 'lucide-react';

export default function SubmissionResult({ user, submissionId, onBack, onOpenLab }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradeMsg, setGradeMsg] = useState('');

  useEffect(() => {
    loadDetail();
  }, [submissionId]);

  const loadDetail = async () => {
    try {
      const data = await api.getSubmissionDetail(submissionId);
      setSubmission(data);
      setGradeInput(data.teacher_grade !== null ? String(data.teacher_grade) : '');
      setFeedbackInput(data.teacher_feedback || '');
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  const handleRedo = async () => {
    if (!submission?.assignment?.id || !onOpenLab) return;
    try {
      const sub = await api.startSubmission(submission.assignment.id, true);
      onOpenLab(submission.assignment, sub.id);
    } catch (_) {}
  };

  const handleSaveGrade = async () => {
    setGradeMsg('');
    if (!gradeInput || isNaN(gradeInput) || Number(gradeInput) < 0 || Number(gradeInput) > 100) {
      setGradeMsg('0 dan 100 gacha ball kiriting');
      return;
    }
    setIsGrading(true);
    try {
      const updated = await api.gradeSubmission(submission.id, gradeInput, feedbackInput);
      setSubmission(updated);
      setGradeMsg('Baho muvaffaqiyatli saqlandi');
    } catch (err) {
      setGradeMsg(err.message);
    } finally {
      setIsGrading(false);
    }
  };

  if (loading || !submission) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#545AE8]/30 border-t-[#545AE8] rounded-full animate-spin" />
      </div>
    );
  }

  const isGraded = submission.status === 'GRADED' && submission.teacher_grade !== null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 border border-slate-200 shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Orqaga qaytish</span>
        </button>

        {user?.role === 'STUDENT' && onOpenLab && (
          <button
            onClick={handleRedo}
            className="px-4 py-2 rounded-xl bg-[#545AE8] hover:bg-[#4349D6] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Laboratoriyani Qayta Bajarish</span>
          </button>
        )}
      </div>

      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-all ${
          isGraded
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isGraded ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {isGraded ? <CheckCircle2 className="w-8 h-8" /> : <Hourglass className="w-8 h-8" />}
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider opacity-75">
                {isGraded ? 'Tekshirildi va Baholandi' : 'Ustoz tekshiruvi kutilmoqda'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] mt-0.5">
                {submission.assignment?.title || 'Amaliy Topshiriq'}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Talaba: <strong>{submission.student?.full_name || submission.student?.username}</strong> ({submission.student?.group_name || 'SE-23'})
              </p>
            </div>
          </div>

          {isGraded && (
            <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-6">
              <div className="text-xs text-emerald-700 font-bold">Yakuniy Ball</div>
              <div className="text-4xl font-black text-emerald-600 tracking-tight">
                {submission.teacher_grade}
                <span className="text-lg text-emerald-500 font-normal"> / 100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-1">
            <TrendingUp className="w-4 h-4 text-[#545AE8]" />
            <span>Progress</span>
          </div>
          <div className="text-2xl font-black text-[#0F172A]">{submission.ai_progress_percent}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Bajarilish darajasi</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-1">
            <Bug className="w-4 h-4 text-amber-500" />
            <span>Xatolar</span>
          </div>
          <div className="text-2xl font-black text-[#0F172A]">{submission.ai_errors_count} ta</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {submission.ai_corrected_errors} tasi tuzatildi
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-1">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Ishlash Vaqti</span>
          </div>
          <div className="text-2xl font-black text-[#0F172A]">
            {Math.floor((submission.work_time_seconds || 0) / 60)} daq
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Laboratoriyada sarflandi</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Holat</span>
          </div>
          <div className="text-sm font-extrabold text-[#0F172A] truncate mt-1">
            {submission.ai_functional_status}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Yakuniy natija</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#545AE8] font-extrabold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>AI Activity Analysis (Avtomatik Tahlil Hisoboti)</span>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-[#EEF2F8] text-[#545AE8] font-bold">
            {submission.ai_functional_status}
          </span>
        </div>

        <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
          {submission.ai_summary || 'AI hisoboti tayyorlanmoqda...'}
        </p>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Asosiy Qoida:</strong> AI talabaga baho (ball) qo‘ymaydi. AI faqat talaba bajargan amallar, xatolar va ularni tuzatish jarayoni haqida xolis tahliliy ma‘lumot beradi. Yakuniy bahoni o‘qituvchi belgilaydi.
          </div>
        </div>
      </div>

      {isGraded && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm mb-2">
            <Award className="w-5 h-5" />
            <span>Ustoz Xulosasi va Sharhi</span>
          </div>
          <div className="text-sm text-slate-700 font-medium">
            {submission.teacher_feedback || 'Baho tasdiqlandi.'}
          </div>
        </div>
      )}

      {user?.role === 'TEACHER' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#0F172A]">O‘qituvchi Baholash Paneli</h3>
          {gradeMsg && (
            <div className="p-3 rounded-xl bg-indigo-50 text-[#545AE8] text-xs font-bold">
              {gradeMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Yakuniy Ball (0-100)</label>
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Ustoz Izohi</label>
              <input
                type="text"
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="Talaba ishiga izoh qoldiring..."
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:border-[#545AE8]"
              />
            </div>
          </div>
          <button
            onClick={handleSaveGrade}
            disabled={isGrading}
            className="bg-[#545AE8] hover:bg-[#4349D6] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isGrading ? 'Saqlanmoqda...' : 'Bahoni Saqlash'}</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <h3 className="font-extrabold text-base text-[#0F172A] mb-4">Bajarilgan Harakatlar Tarixi (Activity Log)</h3>

        <div className="space-y-2">
          {submission.activity_logs?.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-6">Loglar topilmadi</div>
          ) : (
            submission.activity_logs.map((log) => {
              const m = Math.floor(log.elapsed_seconds / 60);
              const s = log.elapsed_seconds % 60;
              const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    log.is_error
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : log.is_resolved
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{timeStr}</span>
                    <span className="font-bold text-[#545AE8]">{log.target_device}</span>
                    <span>{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">{log.action_type}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
