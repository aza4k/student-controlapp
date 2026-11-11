import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Network, Code2, Database, Calculator, Play, Plus, X, RotateCcw, Eye, CheckCircle2 } from 'lucide-react';

export default function LabsView({ user, onOpenLab, onOpenResult }) {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mySubmissions, setMySubmissions] = useState({});
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssign, setNewAssign] = useState({
    course: '',
    title: '',
    description: '',
    lab_type: 'NETWORK_LAB',
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignData, courseData, subsData] = await Promise.all([
        api.getAssignments(),
        api.getCourses().catch(() => []),
        api.getTeacherSubmissions().catch(() => []),
      ]);
      setAssignments(assignData);
      setCourses(courseData);
      if (courseData.length > 0) {
        setNewAssign((prev) => ({ ...prev, course: courseData[0].id }));
      }
      const subMap = {};
      subsData.forEach((s) => {
        if (s.assignment?.id) subMap[s.assignment.id] = s;
      });
      setMySubmissions(subMap);
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  const handleStart = async (assignment, reopen = false) => {
    try {
      const sub = await api.startSubmission(assignment.id, reopen);
      if (!reopen && (sub.status === 'SUBMITTED' || sub.status === 'GRADED')) {
        onOpenResult(sub.id);
      } else {
        onOpenLab(assignment, sub.id);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newAssign.title.trim() || !newAssign.course) {
      setErrorMsg('Topshiriq nomi va fanni tanlang');
      return;
    }
    try {
      await api.createAssignment(newAssign);
      setShowCreateModal(false);
      setNewAssign((prev) => ({ ...prev, title: '', description: '' }));
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const labsCatalog = [
    {
      type: 'NETWORK_LAB',
      title: 'Cisco Network Lab',
      desc: 'PC, Switch, Router topologiyasi, IP konfiguratsiya va paketlar simulyatsiyasi.',
      icon: Network,
      color: 'bg-blue-500',
      badge: 'Cisco Packet Tracer',
    },
    {
      type: 'CODE_LAB',
      title: 'Python / C++ Code Lab',
      desc: 'Algoritmlar, saralash, test caselar va avtomatik kod tekshiruvi.',
      icon: Code2,
      color: 'bg-emerald-500',
      badge: 'Python 3.13 Sandbox',
    },
    {
      type: 'DATABASE_LAB',
      title: 'Database & SQL Lab',
      desc: 'Relyatsion jadvallar, SELECT, JOIN, GROUP BY so‘rovlarini tekshirish.',
      icon: Database,
      color: 'bg-amber-500',
      badge: 'SQLite In-Memory',
    },
    {
      type: 'MATH_LAB',
      title: 'Math & Simulation Lab',
      desc: 'Matritsalar, chiziqli algebra va ilmiy tahlil laboratoriyasi.',
      icon: Calculator,
      color: 'bg-purple-500',
      badge: 'Linear Algebra Engine',
    },
  ];

  const filteredAssignments = selectedType === 'ALL'
    ? assignments
    : assignments.filter((a) => a.lab_type === selectedType);

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-3.5 text-xs font-bold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {labsCatalog.map((lab, idx) => {
          const Icon = lab.icon;
          const isSelected = selectedType === lab.type;
          return (
            <div
              key={idx}
              onClick={() => setSelectedType(isSelected ? 'ALL' : lab.type)}
              className={`bg-white rounded-3xl p-6 shadow-sm border flex items-start gap-4 transition-all cursor-pointer group ${
                isSelected ? 'border-[#545AE8] ring-2 ring-[#545AE8]/20' : 'border-slate-100 hover:border-[#545AE8]/40 hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl ${lab.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {lab.badge}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-[#545AE8]">Tanlangan</span>
                  )}
                </div>
                <h4 className="font-extrabold text-base text-[#0F172A] mt-1 group-hover:text-[#545AE8] transition-colors">{lab.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{lab.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-lg text-[#0F172A]">Amaldagi Topshiriqlar</h3>
            {selectedType !== 'ALL' && (
              <button
                onClick={() => setSelectedType('ALL')}
                className="text-xs font-bold text-[#545AE8] bg-indigo-50 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Barchasini ko‘rsatish
              </button>
            )}
          </div>

          {user?.role === 'TEACHER' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#545AE8] hover:bg-[#4349D6] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Topshiriq</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filteredAssignments.map((assign) => {
            const existingSub = mySubmissions[assign.id];
            const isCompleted = existingSub && (existingSub.status === 'SUBMITTED' || existingSub.status === 'GRADED');

            return (
              <div
                key={assign.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-[#545AE8]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#545AE8] font-mono">{assign.course_code}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-500">{assign.course_title}</span>
                    {isCompleted && (
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{existingSub.status === 'GRADED' ? `${existingSub.teacher_grade} ball` : 'Topshirilgan'}</span>
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[#0F172A]">{assign.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{assign.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted ? (
                    <>
                      <button
                        onClick={() => onOpenResult(existingSub.id)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Hisobot</span>
                      </button>
                      <button
                        onClick={() => handleStart(assign, true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Qayta ishlash</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStart(assign, true)}
                      className="bg-[#545AE8] hover:bg-[#4349D6] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-colors"
                    >
                      <span>Laboratoriyaga Kirish</span>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0F172A]">Yangi Laboratoriya Topshirig‘i</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fan (Kurs)</label>
                <select
                  value={newAssign.course}
                  onChange={(e) => setNewAssign({ ...newAssign, course: Number(e.target.value) })}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Laboratoriya Turi</label>
                <select
                  value={newAssign.lab_type}
                  onChange={(e) => setNewAssign({ ...newAssign, lab_type: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
                >
                  <option value="NETWORK_LAB">Cisco Network Lab</option>
                  <option value="CODE_LAB">Python Code Lab</option>
                  <option value="DATABASE_LAB">Database & SQL Lab</option>
                  <option value="MATH_LAB">Math & Simulation Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topshiriq Sarlavhasi</label>
                <input
                  type="text"
                  value={newAssign.title}
                  onChange={(e) => setNewAssign({ ...newAssign, title: e.target.value })}
                  placeholder="Masalan: Lab 5: VLAN va Trunking sozlash"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vazifa Tavsifi</label>
                <textarea
                  rows="3"
                  value={newAssign.description}
                  onChange={(e) => setNewAssign({ ...newAssign, description: e.target.value })}
                  placeholder="Talaba bajarishi kerak bo‘lgan qadamlar..."
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#545AE8]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#545AE8] text-white text-xs font-bold cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
