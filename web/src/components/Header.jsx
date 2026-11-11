import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Mail, Bell, X, ChevronRight, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function Header({ title, user, onNavigate, onOpenLab, onOpenResult }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const inboxMessages = [
    {
      id: 1,
      sender: 'Kafedra mudiri',
      subject: 'Amaliy mashg‘ulotlar grafigi',
      preview: 'Yangi semestr uchun virtual laboratoriya topshiriqlari tasdiqlandi.',
      time: '10:30',
    },
    {
      id: 2,
      sender: 'HEMIS Integratsiya',
      subject: 'Reyting qaydnomasi',
      preview: 'Baholangan amaliyotlar eksporti tizimga muvaffaqiyatli ulandi.',
      time: 'Kecha',
    },
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (_) {}
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const [assigns, courses] = await Promise.all([
        api.getAssignments(),
        api.getCourses(),
      ]);

      const matchedAssigns = assigns.filter(
        (a) =>
          a.title.toLowerCase().includes(q.toLowerCase()) ||
          a.description.toLowerCase().includes(q.toLowerCase())
      );
      const matchedCourses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q.toLowerCase()) ||
          c.code.toLowerCase().includes(q.toLowerCase())
      );

      setSearchResults([
        ...matchedAssigns.map((a) => ({ type: 'Topshiriq', title: a.title, sub: a.course_code, data: a })),
        ...matchedCourses.map((c) => ({ type: 'Kurs', title: c.title, sub: c.code, data: c })),
      ]);
    } catch (_) {}
  };

  const handleSelectSearchResult = async (item) => {
    setShowSearchModal(false);
    if (item.type === 'Topshiriq' && onOpenLab) {
      try {
        const sub = await api.startSubmission(item.data.id);
        if (sub.status === 'SUBMITTED' || sub.status === 'GRADED') {
          onOpenResult && onOpenResult(sub.id);
        } else {
          onOpenLab(item.data, sub.id);
        }
      } catch (_) {
        onNavigate && onNavigate('labs');
      }
    } else {
      onNavigate && onNavigate('labs');
    }
  };

  const displayName = user?.full_name || user?.username || 'Foydalanuvchi';
  const roleLabel = user?.role === 'TEACHER' ? 'O\'qituvchi' : (user?.group_name || 'SE-23 guruhi');
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-transparent shrink-0 relative">
      <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">{title}</h1>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-[#64748B] relative">
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 rounded-xl hover:bg-white transition-colors cursor-pointer text-[#64748B] hover:text-[#0F172A]"
            title="Qidiruv"
          >
            <Search className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowInbox(!showInbox);
                setShowNotifications(false);
              }}
              className="p-2 rounded-xl hover:bg-white transition-colors cursor-pointer text-[#64748B] hover:text-[#0F172A] relative"
              title="Xabarlar"
            >
              <Mail className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-[#545AE8] absolute top-1.5 right-1.5" />
            </button>

            {showInbox && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-50 text-[#0F172A] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#545AE8]" />
                    <span>Ichki Xabarlar</span>
                  </span>
                  <button
                    onClick={() => setShowInbox(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {inboxMessages.map((m) => (
                    <div key={m.id} className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 text-xs">
                      <div className="flex justify-between font-bold text-[#0F172A] mb-0.5">
                        <span>{m.sender}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{m.time}</span>
                      </div>
                      <div className="font-semibold text-[#545AE8] text-[11px] mb-1">{m.subject}</div>
                      <p className="text-[11px] text-slate-500 leading-snug">{m.preview}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowInbox(false);
              }}
              className="p-2 rounded-xl hover:bg-white transition-colors cursor-pointer text-[#64748B] hover:text-[#0F172A] relative"
              title="Bildirishnomalar"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#FDB528] absolute top-1.5 right-1.5 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-50 text-[#0F172A] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-extrabold text-xs">Bildirishnomalar ({notifications.length})</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">Yangi xabarnomalar yo‘q</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border text-xs transition-colors ${
                          n.unread ? 'bg-[#EEF2F8] border-[#545AE8]/20' : 'bg-[#F8FAFC] border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs text-[#0F172A] mb-1">
                          <span>{n.title}</span>
                          <span className="text-[9px] text-slate-400 font-normal">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-[#CBD5E1]">
          <div className="text-right">
            <div className="text-sm font-bold text-[#0F172A] leading-tight">{displayName}</div>
            <div className="text-[11px] text-[#64748B] font-medium">{roleLabel}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#545AE8]/10 border-2 border-white shadow-sm flex items-center justify-center font-bold text-sm text-[#545AE8]">
            {displayName[0]}
          </div>
        </div>
      </div>

      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-20">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-extrabold text-sm text-[#0F172A]">Platforma Bo‘ylab Qidiruv</span>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Topshiriq yoki fan nomini kiriting..."
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#545AE8]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  {searchQuery ? 'Hech narsa topilmadi' : 'Qidirish uchun so‘z yozing'}
                </div>
              ) : (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-[#545AE8]/40 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.type}
                      </span>
                      <div className="font-bold text-xs text-[#0F172A] mt-1">{item.title}</div>
                      <div className="text-[10px] text-slate-400">{item.sub}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
