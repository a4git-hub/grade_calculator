import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CourseDetail from './components/CourseDetail';
import FinalCalculator from './components/FinalCalculator';
import './index.css';

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('ic_cached_student_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    <div className="app-container">
      {
        !data ? (
          <Login onLogin={handleLogin} autoSync={isRefreshing} />
        ) : (
          <>
            {!selectedCourse ? (
              <Dashboard data={data} onSelectCourse={setSelectedCourse} onLogout={handleLogout} onRefresh={handleRefresh} />
            ) : (
              <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />
            )}
          </>
        )
      }
    </div >
  );
}

export default App;
