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

    logAction('DB_LAB_OPENED', 'SQL_Editor', 'Talaba SQL laboratoriyasini ochdi');
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

    logAction('SQL_EXECUTE', 'SQLite', `So‘rov ijroga yuborildi (#${runCount + 1})`);

    try {
      const res = await api.runSQL(query);
      setIsRunning(false);
      setResult(res);

      if (res.is_error) {
        setErrorCount((p) => p + 1);
        logAction('SQL_ERROR', 'SQLite', `Xato: ${res.error}`, true);
      } else {
        logAction('SQL_SUCCESS', 'SQLite', `Muvaffaqiyatli: ${res.row_count} qator olindi`, false, errorCount > 0);
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
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
    { label: 'SELECT Students', sql: 'SELECT * FROM students;' },
    { label: 'GPA > 4.5', sql: 'SELECT full_name, gpa FROM students WHERE gpa > 4.5;' },
    { label: 'Course Avg', sql: 'SELECT c.title, AVG(g.score) as avg_score FROM grades g JOIN courses c ON g.course_id = c.id GROUP BY c.title;' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#080d1e] overflow-hidden text-slate-100">
      <div className="glass-nav px-6 py-3 flex items-center justify-between border-b border-white/10 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{assignment.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Database & SQL Lab
              </span>
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vaqt: {formatTime(elapsedSeconds)}</span>
              </span>
              <span>So‘rovlar: {runCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuery(DEFAULT_SQL)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 border border-white/10 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tiklash</span>
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Bajarilmoqda...' : 'RUN QUERY'}</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Topshirish</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col bg-[#0b1021] border-r border-white/10">
          <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2 font-mono font-bold text-amber-400">
              <Database className="w-4 h-4" />
              <span>query.sql</span>
            </span>
            <div className="flex items-center gap-2">
              {quickSnippets.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(s.sql)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-slate-300 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-1.5 bg-[#070b17] border-b border-white/5 text-[11px] text-slate-400 font-mono flex items-center gap-4">
            <span className="text-slate-500">Jadvallar:</span>
            <span className="text-cyan-400">students(id, full_name, group_name, gpa, department_id)</span>
            <span className="text-amber-400">departments(id, name, building)</span>
            <span className="text-emerald-400">courses(id, title, credits)</span>
            <span className="text-purple-400">grades(id, student_id, course_id, score)</span>
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 w-full p-4 font-mono text-sm leading-relaxed text-slate-200 bg-transparent resize-none focus:outline-none selection:bg-amber-500/30"
            placeholder="SQL so'rovingizni bu yerga yozing..."
            spellCheck="false"
          />
        </div>

        <div className="w-full md:w-[460px] flex flex-col bg-[#060a17]/90 border-t md:border-t-0 md:border-l border-white/10">
          <div className="flex-1 flex flex-col border-b border-white/10 overflow-hidden">
            <div className="px-4 py-2 bg-white/5 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-2">
                <TableIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Natijalar Jadvali</span>
              </span>
              {result && !result.is_error && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{result.row_count} qator</span>
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto p-3 bg-[#020617]">
              {!result ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  So‘rov natijalari shu yerda aks etadi...
                </div>
              ) : result.is_error ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono whitespace-pre-wrap">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>SQL XATOLIK:</span>
                  </div>
                  <div>{result.error}</div>
                </div>
              ) : (
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-white/10 text-slate-200 border-b border-white/10">
                      <tr>
                        {result.columns.map((col, idx) => (
                          <th key={idx} className="p-2 font-bold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="p-2 text-slate-300 whitespace-nowrap">
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

          <div className="h-56 flex flex-col">
            <div className="px-4 py-2 bg-white/5 flex items-center justify-between text-xs font-bold text-slate-300 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Activity Log</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg border text-[11px] ${
                    log.isError
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : log.isResolved
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/5 border-white/5 text-slate-400'
                  }`}
                >
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mb-0.5">
                    <span>{log.actionType}</span>
                    <span>{formatTime(log.seconds)}</span>
                  </div>
                  <div>{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">SQL amaliyotni yakunlaysizmi?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              So‘rovingiz va bajarilish tarixi tahlil qilinib, ustoz paneliga hisobot yuboriladi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmAndSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
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
