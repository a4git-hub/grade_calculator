import React, { useState } from 'react';
import { calculateOverallGrade, calculateCategoryGrade, getLetterGrade } from '../utils/mathEngine';
import FinalCalculator from './FinalCalculator';

export default function CourseDetail({ course, onBack }) {
  const [categories, setCategories] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  React.useEffect(() => {
    if (!course || !course.assignments || course.assignments.length === 0) {
      setCategories([{
        id: 'main',
        name: 'All Assignments',
        weight: 1.0,
        assignments: []
      }]);
      return;
    }

    // Polluted legacy local storage blocks removed: We now run 100% via auto-sorter

    const categoriesMap = {};
    const assignmentToCategory = {};

    // 1. Fully Auto-Sort Categories and Assignments via Native Details API
    if (course.detailData && course.detailData.data && course.detailData.data.details) {
      course.detailData.data.details.forEach(task => {
        if (task.categories) {
          task.categories.forEach(cat => {
            // We use native name as fallback ID if groupID doesn't exist
            const catId = String(cat.groupID || cat.name); 
            
            if (!categoriesMap[catId] && parseFloat(cat.weight) >= 0) {
              categoriesMap[catId] = {
                id: catId,
                name: cat.name || "Unknown Category",
                weight: parseFloat(cat.weight) / 100, // IC sends 65.0 for 65%
                assignments: []
              };
            }

            // Map every assignment's native IDs to this Category
            if (cat.assignments) {
              cat.assignments.forEach(a => {
                if (a.objectSectionID) assignmentToCategory[String(a.objectSectionID)] = catId;
                if (a.groupActivityID) assignmentToCategory[String(a.groupActivityID)] = catId;
              });
            }
          });
        }
      });
    }

    // Fallback: If details fetch failed, grab from general rawCategories
    if (Object.keys(categoriesMap).length === 0 && course.rawCategories) {
      course.rawCategories.forEach(cat => {
        const catId = String(cat.categoryID);
        categoriesMap[catId] = {
          id: catId,
          name: cat.name || "Unknown Category",
          weight: cat.weight ? (parseFloat(cat.weight) / 100) : 0,
          assignments: []
        };
      });
    }



    // Default category for uncategorized assignments
    if (!categoriesMap["cat_default"]) {
      categoriesMap["cat_default"] = { id: "cat_default", name: "All Assignments", weight: 0, assignments: [] };
    }

    course.assignments
      .filter(a => a.score != null && a.score !== "" && !isNaN(parseFloat(a.score)))
      .forEach((a, i) => {
        const scoreVal = parseFloat(a.score) || 0;
        let totalVal = parseFloat(a.totalPoints);
        if (isNaN(totalVal)) totalVal = 100;

        const assignmentId = (a.objectSectionID || 'a') + "_" + i;
        
        // Assign to matched native category, else fallback
        let activeCatId = "cat_default";
        if (a.objectSectionID && assignmentToCategory[String(a.objectSectionID)]) {
           activeCatId = assignmentToCategory[String(a.objectSectionID)];
        } else if (a.groupActivityID && assignmentToCategory[String(a.groupActivityID)]) {
           activeCatId = assignmentToCategory[String(a.groupActivityID)];
        }

        if (!categoriesMap[activeCatId]) {
          categoriesMap[activeCatId] = { id: activeCatId, name: "Custom", weight: 0, assignments: [] };
        }

        categoriesMap[activeCatId].assignments.push({
          id: assignmentId,
          name: a.assignmentName || `Assignment ${i}`,
          score: scoreVal,
          total_points: totalVal,
          isFake: false
        });
      });

    const mappedCategories = Object.values(categoriesMap).filter(c => c.assignments.length > 0 || c.weight > 0);
    setCategories(mappedCategories);
  }, [course, refreshTrigger]);

  const [showWhatIf, setShowWhatIf] = useState(false);
  const [fakeName, setFakeName] = useState('Final Exam');
  const [fakeScore, setFakeScore] = useState(100);
  const [fakeTotal, setFakeTotal] = useState(100);
  const [fakeCategory, setFakeCategory] = useState(categories.length > 0 ? categories[0].id : '');

  // Math engine
  const totalWeight = categories.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
  const isSetup = totalWeight > 0.01;
  const computedGrade = calculateOverallGrade(categories);

  const formatICGrade = (g) => {
    if (g === "N/A" || !g) return "N/A%";
    const val = parseFloat(g);
    return isNaN(val) ? String(g) : val.toFixed(2) + "%";
  };

  const [editingId, setEditingId] = useState(null);
  const [editingScore, setEditingScore] = useState('');

  const hasOverrides = categories.some(cat => cat.assignments.some(a => a.isFake || a.isEdited || a.isDropped));
  const activeGradeValue = hasOverrides ? computedGrade : parseFloat(course.grade);
  const displayGrade = hasOverrides ? computedGrade.toFixed(2) + "%" : formatICGrade(course.grade);
  const displayLetter = hasOverrides ? getLetterGrade(activeGradeValue) : (course.letterGrade || getLetterGrade(parseFloat(course.grade)));

  const handleEditScore = (catId, assignmentId, newScore) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          assignments: cat.assignments.map(a => 
            a.id === assignmentId ? { ...a, score: newScore, isEdited: true, isDropped: false } : a
          )
        };
      }
      return cat;
    }));
  };

  const handleToggleDrop = (catId, assignmentId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          assignments: cat.assignments.map(a => 
            a.id === assignmentId ? { ...a, isDropped: !a.isDropped } : a
          )
        };
      }
      return cat;
    }));
  };

  const handleAddFake = (e) => {
    e.preventDefault();
    const newAssignment = {
      id: 'fake_' + Date.now(),
      name: `(What-If) ${fakeName}`,
      score: parseFloat(fakeScore),
      total_points: parseFloat(fakeTotal),
      isFake: true
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === (fakeCategory || categories[0]?.id)) {
        return { ...cat, assignments: [...cat.assignments, newAssignment] };
      }
      return cat;
    }));
    setShowWhatIf(false);
  };

  const handleRemoveFake = (catId, assignmentId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === catId) {
        return { ...cat, assignments: cat.assignments.filter(a => a.id !== assignmentId) };
      }
      return cat;
    }));
  };

  return (
    <div className="course-detail-container animate-slide-up">
      <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '1.5rem' }}>← Back to Dashboard</button>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>{course.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Term {course.term}</p>
          </div>
          <div style={{ textAlign: 'right', flex: '1 1 100%' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Grade</span><br />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <span className={activeGradeValue >= 90 ? 'grade-A' : activeGradeValue >= 80 ? 'grade-B' : activeGradeValue >= 70 ? 'grade-C' : activeGradeValue >= 60 ? 'grade-D' : 'grade-F'} style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {displayLetter}
              </span>
              <span style={{ fontSize: '1.8rem', fontWeight: '300', color: 'var(--text-secondary)', lineHeight: '1' }}>·</span>
              <span className={activeGradeValue >= 90 ? 'grade-A' : activeGradeValue >= 80 ? 'grade-B' : activeGradeValue >= 70 ? 'grade-C' : activeGradeValue >= 60 ? 'grade-D' : 'grade-F'} style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {displayGrade}
              </span>
              {/* Mock Trend Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                  <span style={{ marginLeft: '4px' }}>+1.2%</span>
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>vs last week</span>
              </div>
            </div>
            {!isSetup && course.assignments && course.assignments.length > 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--warning-color)', marginTop: '4px' }}>
                Weights unconfigured. Showing official sync'd grade.
              </div>
            ) : (
              isSetup && (
                <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '4px', fontWeight: '500' }}>
                  Your Custom Calc: {computedGrade.toFixed(2)}%
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Assignments</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {hasOverrides && (
            <button onClick={() => { setRefreshTrigger(prev => prev + 1); setShowWhatIf(false); }} className="btn-secondary" style={{ width: 'auto', color: 'var(--danger-color)', borderColor: 'var(--danger-color)', padding: '0.5rem 1rem' }}>
              Reset Simulator
            </button>
          )}
          <button onClick={() => setShowWhatIf(!showWhatIf)} className="btn-primary" style={{ width: 'auto' }}>
            + Add What-If
          </button>
        </div>
      </div>

      {showWhatIf && (
        <div className="glass-card animate-slide-up" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Simulate a Grade</h3>
          <form style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }} onSubmit={handleAddFake}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assignment Name</label>
              <input type="text" className="input-field" value={fakeName} onChange={(e) => setFakeName(e.target.value)} required />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Points Earned</label>
              <input type="number" step="0.1" className="input-field" value={fakeScore} onChange={(e) => setFakeScore(e.target.value)} required />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Points</label>
              <input type="number" step="0.1" className="input-field" value={fakeTotal} onChange={(e) => setFakeTotal(e.target.value)} required />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
              <select className="input-field" value={fakeCategory} onChange={(e) => setFakeCategory(e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} (wt: {(parseFloat(c.weight) * 100).toFixed(0)}%)</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Simulate</button>
          </form>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat.id} style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{cat.name} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({(parseFloat(cat.weight) * 100).toFixed(0)}% weight)</span></span>
            <span>{cat.assignments.length > 0 ? calculateCategoryGrade(cat.assignments).toFixed(2) + '%' : 'N/A'}</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {cat.assignments.map(a => (
              <div key={a.id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: a.isFake ? '1px dashed var(--warning-color)' : '', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontWeight: '500', textDecoration: a.isDropped ? 'line-through' : 'none', opacity: a.isDropped ? 0.5 : 1 }}>{a.name}</span>
                  {a.isFake && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--warning-color)', border: '1px solid var(--warning-color)', borderRadius: '4px', padding: '2px 6px' }}>What-If</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {editingId === a.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="number" 
                        step="0.1"
                        autoFocus
                        onBlur={() => {
                           const val = parseFloat(editingScore);
                           if (!isNaN(val)) handleEditScore(cat.id, a.id, val);
                           setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              const val = parseFloat(editingScore);
                              if (!isNaN(val)) handleEditScore(cat.id, a.id, val);
                              setEditingId(null);
                           } else if (e.key === 'Escape') {
                              setEditingId(null);
                           }
                        }}
                        className="input-field" 
                        style={{ width: '60px', padding: '0.2rem 0.5rem', fontSize: '1rem', textAlign: 'right', margin: 0 }} 
                        value={editingScore} 
                        onChange={(e) => setEditingScore(e.target.value)} 
                      />
                      <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>/ {a.total_points}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span 
                        onClick={() => { setEditingId(a.id); setEditingScore(a.score); }}
                        style={{ fontFamily: 'monospace', fontSize: '1.1rem', cursor: 'pointer', borderBottom: '1px dashed var(--text-secondary)', paddingBottom: '2px' }}
                        title="Click to edit score"
                      >
                        {a.score} / {a.total_points}
                      </span>
                      {a.isEdited && <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Edited</span>}
                    </div>
                  )}
                  <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: 'bold', textDecoration: a.isDropped ? 'line-through' : 'none', opacity: a.isDropped ? 0.5 : 1 }}>{((a.score / Math.max(a.total_points, 0.001)) * 100).toFixed(1)}%</span>
                  
                  <button 
                    onClick={() => handleToggleDrop(cat.id, a.id)} 
                    className="btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '0.8rem', border: 'none', background: 'transparent', cursor: 'pointer', color: a.isDropped ? 'var(--warning-color)' : 'var(--text-secondary)' }}
                  >
                    {a.isDropped ? 'Keep' : 'Drop'}
                  </button>

                  {a.isFake && (
                    <button onClick={() => handleRemoveFake(cat.id, a.id)} className="btn-secondary" style={{ color: 'var(--danger-color)', padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              </div>
            ))}
            {cat.assignments.length === 0 && (
              <div style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No assignments yet.</div>
            )}
          </div>
        </div>
      ))}
      <FinalCalculator currentCourseGrade={activeGradeValue ? parseFloat(activeGradeValue.toFixed(2)) : 0} categories={categories} />
    </div>
  );
}
