import React, { useState, useEffect } from 'react';
import { api } from '../api';
import confetti from 'canvas-confetti';
import {
  Code2,
  Calculator,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  RotateCcw,
  Terminal,
  Activity,
  ArrowLeft
} from 'lucide-react';

const DEFAULT_PYTHON = `def sort_array(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return sort_array(left) + middle + sort_array(right)

test_data = [64, 34, 25, 12, 22, 11, 90]
print("Boshlang'ich:", test_data)
result = sort_array(test_data)
print("Saralangan:", result)
`;

const DEFAULT_MATH_PYTHON = `def matrix_multiply(A, B):
    rows_a, cols_a = len(A), len(A[0])
    rows_b, cols_b = len(B), len(B[0])
    result = [[0 for _ in range(cols_b)] for _ in range(rows_a)]
    for i in range(rows_a):
        for j in range(cols_b):
            for k in range(cols_a):
                result[i][j] += A[i][k] * B[k][j]
    return result

def determinant_2x2(M):
    return M[0][0] * M[1][1] - M[0][1] * M[1][0]

A = [[4, 2], [3, 5]]
B = [[1, 3], [2, 4]]

print("Matritsa A:", A)
print("Matritsa B:", B)
print("A * B ko'paytmasi:", matrix_multiply(A, B))
print("det(A) determinanti:", determinant_2x2(A))
`;

export default function CodeLab({ assignment, submissionId, onBack, onComplete }) {
  const isMathLab = assignment?.lab_type === 'MATH_LAB';
  const defaultTemplate = isMathLab ? DEFAULT_MATH_PYTHON : DEFAULT_PYTHON;

  const [code, setCode] = useState(defaultTemplate);
  const [terminalOutput, setTerminalOutput] = useState('Dastur natijasi shu yerda chiqadi...\nKodni yozing va [ RUN CODE ] tugmasini bosing.');
  const [execStatus, setExecStatus] = useState(null);
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
      if (sub?.final_state?.code) {
        setCode(sub.final_state.code);
      }
      if (sub?.work_time_seconds) {
        setElapsedSeconds(sub.work_time_seconds);
      }
    }).catch(() => {});

    logAction('CODE_LAB_OPENED', 'Editor', 'Talaba dasturlash muhitini ochdi');
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
    if (!code.trim()) {
      setExecStatus('ERROR');
      setTerminalOutput('Xatolik: Kod bo‘sh bo‘lishi mumkin emas.');
      return;
    }

    setIsRunning(true);
    setExecStatus('RUNNING');
    setRunCount((p) => p + 1);
    setTerminalOutput('Kod ijro etilmoqda...\n');

    logAction('CODE_RUN', 'Python', `Kod ijroga yuborildi (Urinish #${runCount + 1})`);

    try {
      const res = await api.runCode(code);
      setIsRunning(false);

      if (res.is_error) {
        setErrorCount((p) => p + 1);
        setExecStatus('ERROR');
        setTerminalOutput(`XATOLIK:\n${res.stderr}\n${res.stdout}`);
        logAction('CODE_ERROR', 'Python', `Xatolik: ${(res.stderr || '').split('\n')[0]}`, true);
      } else {
        setExecStatus('SUCCESS');
        setTerminalOutput(`IJRO MUVAFFAQIYATLI (Output):\n${res.stdout}`);
        logAction('CODE_SUCCESS', 'Python', 'Kod muvaffaqiyatli bajarildi', false, errorCount > 0);
      }
    } catch (err) {
      setIsRunning(false);
      setExecStatus('ERROR');
      setTerminalOutput(`Server xatosi: ${err.message}`);
    }
  };

  const confirmAndSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const finalState = {
        code,
        terminal_output: terminalOutput,
        run_count: runCount,
      };

      const res = await api.submitAssignment(submissionId, finalState, elapsedSeconds);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onComplete(res.id);
    } catch (err) {
      setExecStatus('ERROR');
      setTerminalOutput(`Topshirishda xato: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                isMathLab
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {isMathLab ? 'Math & Simulation Lab' : 'Code Lab'}
              </span>
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vaqt: {formatTime(elapsedSeconds)}</span>
              </span>
              <span>Urinishlar: {runCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode(defaultTemplate)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 border border-white/10 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tiklash</span>
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Bajarilmoqda...' : 'RUN CODE'}</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Topshirish</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col bg-[#0b1021] border-r border-white/10">
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2 font-mono font-bold text-cyan-400">
              {isMathLab ? <Calculator className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
              <span>{isMathLab ? 'matrix_sim.py' : 'solution.py'}</span>
            </span>
            <span>Python 3.13 Sandbox</span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full p-4 font-mono text-sm leading-relaxed text-slate-200 bg-transparent resize-none focus:outline-none selection:bg-cyan-500/30"
            placeholder="Python kodingizni bu yerga yozing..."
            spellCheck="false"
          />
        </div>

        <div className="w-full md:w-96 flex flex-col bg-[#060a17]/90 border-t md:border-t-0 md:border-l border-white/10">
          <div className="flex-1 flex flex-col border-b border-white/10">
            <div className="px-4 py-2 bg-white/5 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Console Output</span>
              </span>
              {execStatus === 'RUNNING' && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>RUNNING</span>
                </span>
              )}
              {execStatus === 'SUCCESS' && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>OK</span>
                </span>
              )}
              {execStatus === 'ERROR' && (
                <span className="flex items-center gap-1 text-[10px] text-rose-400">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>ERROR</span>
                </span>
              )}
            </div>
            <div className={`flex-1 p-3 bg-[#020617] font-mono text-xs overflow-y-auto whitespace-pre-wrap ${
              execStatus === 'ERROR' ? 'text-rose-300' : 'text-cyan-300'
            }`}>
              {terminalOutput}
            </div>
          </div>

          <div className="h-64 flex flex-col">
            <div className="px-4 py-2 bg-white/5 flex items-center justify-between text-xs font-bold text-slate-300 border-b border-white/5">
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
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
            <h3 className="font-bold text-white text-base">Topshiriqni yakunlaysizmi?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kodingiz va bajarilish tarixi tahlil qilinib, ustoz paneliga hisobot yuboriladi.
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
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer"
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
