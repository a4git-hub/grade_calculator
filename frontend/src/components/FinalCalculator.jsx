import React, { useState, useEffect } from 'react';
import { calculateFinalExamGrade } from '../utils/mathEngine';

export default function FinalCalculator({ currentCourseGrade }) {
  const [currentGrade, setCurrentGrade] = useState(currentCourseGrade ? currentCourseGrade.toFixed(2) : '');

  useEffect(() => {
    if (currentCourseGrade !== undefined) {
      setCurrentGrade(currentCourseGrade.toFixed(2));
    }
  }, [currentCourseGrade]);
  const [desiredGrade, setDesiredGrade] = useState('');
  const [finalWeight, setFinalWeight] = useState('');

  const [result, setResult] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    const needed = calculateFinalExamGrade(
      parseFloat(currentGrade),
      parseFloat(desiredGrade),
      parseFloat(finalWeight)
    );
    setResult(needed);
  };

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '2rem', marginTop: '2rem' }}>
      < h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }
      }> Final Exam Calculator</h2 >
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Find out what you need on your final to keep your grade.</p>

      <form onSubmit={handleCalculate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Grade (%)</label>
          <input type="number" step="0.01" className="input-field" value={currentGrade} onChange={(e) => setCurrentGrade(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Desired Grade (%)</label>
          <input type="number" step="0.01" className="input-field" value={desiredGrade} onChange={(e) => setDesiredGrade(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Final Exam Weight (%)</label>
          <input type="number" step="0.01" className="input-field" value={finalWeight} onChange={(e) => setFinalWeight(e.target.value)} placeholder="e.g. 20" required />
        </div>
        <button type="submit" className="btn-primary">Calculate</button>
      </form >

      {result !== null && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 'normal' }}>
            You need a <strong>{result}%</strong> on the final.
          </h3>
          {parseFloat(result) > 100 && (
            <p style={{ color: 'var(--warning-color)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Uh oh. Unless there's extra credit, this might be mathematically impossible!
            </p>
          )}
        </div>
      )}
    </div >
  );
}
