import React, { useState, useEffect } from 'react';
import { calculateAdvancedFinalExamGrade } from '../utils/mathEngine';

export default function FinalCalculator({ currentCourseGrade, categories = [] }) {
  const [desiredGrade, setDesiredGrade] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [finalPoints, setFinalPoints] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (categories.length > 0 && !targetCategory) {
      setTargetCategory(categories[0].id);
    }
  }, [categories]);

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!targetCategory) return;
    const needed = calculateAdvancedFinalExamGrade(
      categories,
      targetCategory,
      parseFloat(desiredGrade),
      finalPoints ? parseFloat(finalPoints) : null
    );
    setResult(needed);
  };

  const selectedCat = categories.find(c => c.id === targetCategory);
  // Only ask for points if the category already has assignments, otherwise point weigh doesn't matter (it dictates 100% of the category)
  const needsPointsInput = selectedCat && selectedCat.assignments && selectedCat.assignments.filter(a => a.score !== null && a.score !== undefined).length > 0;

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '2rem', marginTop: '2rem' }}>
      < h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }
      }> Final Exam Calculator</h2 >
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Find out what you need on your final to keep your grade.</p>

      <form onSubmit={handleCalculate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Grade</label>
          <div className="input-field" style={{ background: 'transparent', border: 'none', paddingLeft: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{currentCourseGrade}%</div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Desired Grade (%)</label>
          <input type="number" step="0.01" className="input-field" value={desiredGrade} onChange={(e) => setDesiredGrade(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Final Exam Category</label>
          <select className="input-field" value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} required>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({(parseFloat(c.weight) * 100).toFixed(0)}%)</option>)}
          </select>
        </div>
        {needsPointsInput && (
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Points</label>
            <input type="number" step="0.1" className="input-field" value={finalPoints} onChange={(e) => setFinalPoints(e.target.value)} placeholder="e.g. 100" required />
          </div>
        )}
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
