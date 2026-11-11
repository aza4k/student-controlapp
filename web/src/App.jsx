import React, { useState, useEffect } from 'react';
import { api } from './api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RightPanel from './components/RightPanel';
import Login from './pages/Login';
import DashboardView from './pages/DashboardView';
import LabsView from './pages/LabsView';
import SubmissionsView from './pages/SubmissionsView';
import CalendarView from './pages/CalendarView';
import SettingsView from './pages/SettingsView';
import NetworkLab from './pages/NetworkLab';
import CodeLab from './pages/CodeLab';
import DatabaseLab from './pages/DatabaseLab';
import SubmissionResult from './pages/SubmissionResult';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(15);

  const [activeAssignment, setActiveAssignment] = useState(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [viewingResultId, setViewingResultId] = useState(null);

  useEffect(() => {
    const saved = api.getUser();
    if (saved) setUser(saved);
  }, []);

  const handleLoginSuccess = (u) => {
    setUser(u);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setActiveAssignment(null);
    setActiveSubmissionId(null);
    setViewingResultId(null);
    setSelectedStudent(null);
  };

  const handleOpenLab = (assignment, subId) => {
    setActiveAssignment(assignment);
    setActiveSubmissionId(subId);
    setViewingResultId(null);
  };

  const handleOpenResult = (subId) => {
    setViewingResultId(subId);
    setActiveAssignment(null);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (activeAssignment && activeSubmissionId) {
    if (activeAssignment.lab_type === 'CODE_LAB' || activeAssignment.lab_type === 'MATH_LAB') {
      return (
        <CodeLab
          assignment={activeAssignment}
          submissionId={activeSubmissionId}
          onBack={() => setActiveAssignment(null)}
          onComplete={(id) => handleOpenResult(id)}
        />
      );
    } else if (activeAssignment.lab_type === 'DATABASE_LAB') {
      return (
        <DatabaseLab
          assignment={activeAssignment}
          submissionId={activeSubmissionId}
          onBack={() => setActiveAssignment(null)}
          onComplete={(id) => handleOpenResult(id)}
        />
      );
    }
    return (
      <NetworkLab
        assignment={activeAssignment}
        submissionId={activeSubmissionId}
        onBack={() => setActiveAssignment(null)}
        onComplete={(id) => handleOpenResult(id)}
      />
    );
  }

  if (viewingResultId) {
    return (
      <div className="min-h-screen bg-[#EEF2F8] p-6">
        <SubmissionResult
          user={user}
          submissionId={viewingResultId}
          onBack={() => setViewingResultId(null)}
          onOpenLab={handleOpenLab}
        />
      </div>
    );
  }

  const titles = {
    dashboard: 'Dashboard',
    labs: 'Laboratoriyalar',
    submissions: 'Hisobotlar va Tahlil',
    calendar: 'Kalendar va Jadval',
    settings: 'Sozlamalar',
  };

  return (
    <div className="min-h-screen bg-[#EEF2F8] flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={titles[activeTab] || 'Dashboard'}
          user={user}
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenLab={handleOpenLab}
          onOpenResult={handleOpenResult}
        />

        <main className="flex-1 px-8 pb-8 flex flex-col lg:flex-row gap-6 overflow-x-hidden">
          <div className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <DashboardView
                user={user}
                onSelectStudent={(stu) => setSelectedStudent(stu)}
                onOpenLab={handleOpenLab}
                onOpenResult={handleOpenResult}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'labs' && (
              <LabsView
                user={user}
                onOpenLab={handleOpenLab}
                onOpenResult={handleOpenResult}
              />
            )}
            {activeTab === 'submissions' && (
              <SubmissionsView
                user={user}
                onOpenResult={handleOpenResult}
              />
            )}
            {activeTab === 'calendar' && (
              <CalendarView
                selectedDate={selectedDate}
                onOpenLab={handleOpenLab}
                onOpenResult={handleOpenResult}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                user={user}
                onProfileUpdated={(updated) => setUser(updated)}
              />
            )}
          </div>

          <RightPanel
            user={user}
            selectedStudent={selectedStudent}
            onFilterByDate={(day) => {
              setSelectedDate(day);
            }}
          />
        </main>
      </div>
    </div>
  );
}
