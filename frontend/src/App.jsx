import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CourseDetail from './components/CourseDetail';
import FinalCalculator from './components/FinalCalculator';
import './index.css';

function App() {
  const [data, setData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleLogin = (fetchedData) => {
    setData(fetchedData);
  };

  const handleLogout = () => {
    setData(null);
    setSelectedCourse(null);
  };

  return (
    <div className="app-container">
      {
        !data ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            {!selectedCourse ? (
              <Dashboard data={data} onSelectCourse={setSelectedCourse} onLogout={handleLogout} />
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
