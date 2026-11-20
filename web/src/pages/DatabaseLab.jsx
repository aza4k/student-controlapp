import React, { useState, useEffect } from 'react';
import { api } from '../api';
import confetti from 'canvas-confetti';
import {
  Database,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Table as TableIcon,
  Activity,
  ArrowLeft
} from 'lucide-react';

const DEFAULT_SQL = `SELECT 
    s.id,
    s.full_name AS talaba_ismi,
    s.group_name AS guruh,
    s.gpa,
    d.name AS kafedra
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
ORDER BY s.gpa DESC;
`;

export default function DatabaseLab({ assignment, submissionId, onBack, onComplete }) {
  const [query, setQuery] = useState(DEFAULT_SQL);
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);

    api.getSubmissionDetail(submissionId).then((sub) => {
      if (sub?.final_state?.query) {
        setQuery(sub.final_state.query);
      }
      if (sub?.work_time_seconds) {
        setElapsedSeconds(sub.work_time_seconds);
      }
    }).catch(() => {});

    logAction('DB_LAB_OPENED', 'SQL_Editor', 'SQL laboratoriyasi ochildi');
    return () => clearInterval(timer);
  }, [submissionId]);

  const logAction = (actionType, device, details, isError = false, isResolved = false) => {
    const item = {
      id: Date.now() + Math.random(),
      seconds: elapsedSeconds,
      actionType,
      device,
      details,
      isError,
      isResolved,
    };
    setLogs((prev) => [item, ...prev]);

    api.logActivity(submissionId, {
      elapsed_seconds: elapsedSeconds,
      action_type: actionType,
      target_device: device,
      details,
      is_error: isError,
      is_resolved: isResolved,
    });
  };

  const handleRun = async () => {
    if (!query.trim()) {
      setResult({ is_error: true, error: 'SQL so‘rovi bo‘sh bo‘lishi mumkin emas.', columns: [], rows: [] });
      return;
    }

    setIsRunning(true);
    setRunCount((p) => p + 1);

    logAction('SQL_EXECUTE', 'SQLite', `So‘rov bajarildi (#${runCount + 1})`);

    try {
      const res = await api.runSQL(query);
      setIsRunning(false);
      setResult(res);

      if (res.is_error) {
        setErrorCount((p) => p + 1);
        logAction('SQL_ERROR', 'SQLite', `Xato: ${res.error}`, true);
      } else {
        logAction('SQL_SUCCESS', 'SQLite', `${res.row_count} qator natija olindi`, false, errorCount > 0);
      }
    } catch (err) {
      setIsRunning(false);
      setResult({ is_error: true, error: err.message, columns: [], rows: [] });
    }
  };

  const confirmAndSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const finalState = {
        query,
        last_result: result,
        run_count: runCount,
      };

      const res = await api.submitAssignment(submissionId, finalState, elapsedSeconds);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      onComplete(res.id);
    } catch (err) {
      setResult({ is_error: true, error: err.message, columns: [], rows: [] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const quickSnippets = [
    { label: 'Barcha talabalar', sql: 'SELECT * FROM students;' },
    { label: 'GPA > 4.5', sql: 'SELECT full_name, gpa FROM students WHERE gpa > 4.5;' },
    { label: 'O‘rtacha ballar', sql: 'SELECT c.title, AVG(g.score) as avg_score FROM grades g JOIN courses c ON g.course_id = c.id GROUP BY c.title;' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#EEF2F8] overflow-hidden text-[#0F172A]">
      <header className="bg-white px-6 py-3.5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2F8] text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-extrabold text-[#0F172A]">{assignment.title}</h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700">
                SQL Lab
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-4 mt-0.5">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#545AE8]" />
                <span>{formatTime(elapsedSeconds)}</span>
              </span>
              <span>So‘rovlar: <strong className="text-[#0F172A]">{runCount}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setQuery(DEFAULT_SQL)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tiklash</span>
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Bajarilmoqda...' : 'So‘rovni bajarish'}</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#545AE8] hover:bg-[#4349D6] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Topshirish</span>
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-mono font-bold text-[#0F172A]">
              <Database className="w-4 h-4 text-[#545AE8]" />
              <span>query.sql</span>
            </span>
            <div className="flex items-center gap-1.5">
              {quickSnippets.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(s.sql)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EEF2F8] border border-slate-200 text-[11px] font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-sans font-bold text-slate-400">Jadvallar:</span>
            <span><strong className="text-[#545AE8]">students</strong>(id, full_name, group_name, gpa, department_id)</span>
            <span><strong className="text-[#545AE8]">departments</strong>(id, name, building)</span>
            <span><strong className="text-[#545AE8]">courses</strong>(id, title, credits)</span>
            <span><strong className="text-[#545AE8]">grades</strong>(id, student_id, course_id, score)</span>
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 w-full p-5 font-mono text-[13px] leading-relaxed text-[#1E293B] bg-white resize-none focus:outline-none selection:bg-[#545AE8]/15"
            placeholder="SQL so‘rovingizni shu yerga yozing..."
            spellCheck="false"
          />
        </div>

        <div className="w-full md:w-[460px] flex flex-col gap-4 shrink-0">
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between text-xs font-bold text-[#0F172A]">
              <span className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-[#545AE8]" />
                <span>Natijalar Jadvali</span>
              </span>
              {result && !result.is_error && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{result.row_count} qator</span>
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto p-3 custom-scrollbar">
              {!result ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  So‘rov natijalari shu yerda ko‘rinadi
                </div>
              ) : result.is_error ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono whitespace-pre-wrap">
                  <div className="flex items-center gap-1.5 font-sans font-bold mb-1">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>SQL xatoligi</span>
                  </div>
                  <div>{result.error}</div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#F8FAFC] text-[#0F172A] border-b border-slate-200">
                      <tr>
                        {result.columns.map((col, idx) => (
                          <th key={idx} className="p-2.5 font-bold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="p-2.5 text-slate-700 whitespace-nowrap">
                              {val !== null ? String(val) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="h-56 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between text-xs font-bold text-[#0F172A]">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#545AE8]" />
                <span>Harakatlar Jurnali</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400">{logs.length} ta yozuv</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border text-[11px] ${
                    log.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : log.isResolved
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-[#F8FAFC] border-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                    <span className="font-bold">{log.actionType}</span>
                    <span>{formatTime(log.seconds)}</span>
                  </div>
                  <div className="font-medium">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="font-extrabold text-[#0F172A] text-base">SQL amaliyotni yakunlaysizmi?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              So‘rovingiz va bajarilish tarixi tahlil qilinib, o‘qituvchi paneliga hisobot yuboriladi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmAndSubmit}
                className="px-5 py-2 rounded-xl bg-[#545AE8] hover:bg-[#4349D6] text-xs font-bold text-white cursor-pointer"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
