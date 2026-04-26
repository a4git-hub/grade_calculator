import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CourseDetail from './components/CourseDetail';
import Settings from './components/Settings';
import CalculatorView from './components/CalculatorView';
import TutorView from './components/TutorView';
import './index.css';

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('ic_cached_student_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (fetchedData) => {
    localStorage.setItem('ic_cached_student_data', JSON.stringify(fetchedData));
    
    // Save a grade history snapshot for the sparkline graph
    const existing = JSON.parse(localStorage.getItem('ic_grade_history') || '[]');
    const snapshot = {
      timestamp: new Date().toISOString(),
      grades: (fetchedData.courses || []).reduce((acc, c) => {
        acc[c.id || c.name] = parseFloat(c.grade) || null;
        return acc;
      }, {})
    };
    // Keep max 30 snapshots, avoid duplicates within 1 hour
    const lastSnap = existing[existing.length - 1];
    const oneHourAgo = Date.now() - 3600000;
    if (!lastSnap || new Date(lastSnap.timestamp).getTime() < oneHourAgo) {
      existing.push(snapshot);
      if (existing.length > 30) existing.shift();
      localStorage.setItem('ic_grade_history', JSON.stringify(existing));
    }

    setData(fetchedData);
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('ic_cached_student_data');
    setData(null);
    setSelectedCourse(null);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setData(null);
  };

  return (
    <div className="app-container" style={{ paddingBottom: data ? '80px' : '0' }}>
      {
        !data ? (
          <Login onLogin={handleLogin} autoSync={isRefreshing} />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              !selectedCourse ? (
                <Dashboard data={data} onSelectCourse={setSelectedCourse} onRefresh={handleRefresh} />
              ) : (
                <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />
              )
            )}
            {activeTab === 'calculator' && <CalculatorView data={data} />}
            {activeTab === 'tutor' && <TutorView data={data} />}
            {activeTab === 'settings' && <Settings data={data} onLogout={handleLogout} />}

            {/* Bottom Tab Navigation */}
            <div className="bottom-nav">
              <button 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setSelectedCourse(null); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span>DASHBOARD</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'calculator' ? 'active' : ''}`}
                onClick={() => { setActiveTab('calculator'); setSelectedCourse(null); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="8" y1="9" x2="16" y2="9"></line><line x1="12" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="8" y1="13" x2="8.01" y2="13"></line></svg>
                <span>CALCULATOR</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'tutor' ? 'active' : ''}`}
                onClick={() => { setActiveTab('tutor'); setSelectedCourse(null); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                <span>TUTOR</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => { setActiveTab('settings'); setSelectedCourse(null); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span>SETTINGS</span>
              </button>
            </div>
          </>
        )
      }
    </div >
  );
}

export default App;
