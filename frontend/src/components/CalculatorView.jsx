import React, { useState } from 'react';
import FinalCalculator from './FinalCalculator';

export default function CalculatorView({ data }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  
  if (!data || !data.courses) return null;

  const handleSelect = (e) => setSelectedCourse(e.target.value);
  const course = data.courses.find(c => c.id === selectedCourse);

  return (
    <div style={{ padding: '1.5rem', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }} className="animate-slide-up">
      <h1 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Calculator</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Select a course to calculate required final exam grades.</p>
      
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem' }}>
        <select 
          value={selectedCourse} 
          onChange={handleSelect} 
          className="input-field"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: 'inherit', width: '100%', outline: 'none', fontSize: '1.1rem', cursor: 'pointer' }}
        >
          <option value="" disabled>Select a course...</option>
          {data.courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {course && (
        <FinalCalculator 
          currentCourseGrade={course.grade} 
          categories={course.rawCategories} 
        />
      )}
    </div>
  );
}
