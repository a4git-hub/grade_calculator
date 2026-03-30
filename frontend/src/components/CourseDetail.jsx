import React, { useState } from 'react';
import { calculateOverallGrade, calculateCategoryGrade } from '../utils/mathEngine';
import FinalCalculator from './FinalCalculator';

export default function CourseDetail({ course, onBack }) {
  const [categories, setCategories] = useState([]);
  const [isEditingWeights, setIsEditingWeights] = useState(false);
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

    const savedWeightsJson = localStorage.getItem(`grade_calc_course_${course.id}_weights`);
    const savedWeights = savedWeightsJson ? JSON.parse(savedWeightsJson) : {};

    const overrideJson = localStorage.getItem(`grade_calc_course_${course.id}_overrides`);
    const overrides = overrideJson ? JSON.parse(overrideJson) : {};

    const categoriesMap = {};

    // Seed configured categories directly from Infinite Campus API if available
    if (course.rawCategories && course.rawCategories.length > 0) {
      course.rawCategories.forEach(cat => {
        const catId = String(cat.categoryID);
        // IC sends weights as integers/percentages (e.g. 65.0). Convert to our internal decimal layout (0.65).
        const decimalWeight = cat.weight ? (parseFloat(cat.weight) / 100) : 0;
        categoriesMap[catId] = {
          id: catId,
          name: cat.name || "Unknown Category",
          weight: decimalWeight,
          assignments: []
        };
      });
    }

    // Override with savedWeights if the user manually configured or tweaked them previously
    Object.keys(savedWeights).forEach(catId => {
      if (categoriesMap[catId]) {
        categoriesMap[catId].name = savedWeights[catId].name;
        categoriesMap[catId].weight = parseFloat(savedWeights[catId].weight) || 0;
      } else {
        categoriesMap[catId] = {
          id: catId,
          name: savedWeights[catId].name,
          weight: parseFloat(savedWeights[catId].weight) || 0,
          assignments: []
        };
      }
    });

    // Default category for uncategorized assignments
    if (!categoriesMap["cat_default"]) {
      categoriesMap["cat_default"] = { id: "cat_default", name: "All Assignments", weight: 0, assignments: [] };
    }

    course.assignments
      .filter(a => a.score != null && a.score !== "" && !isNaN(parseFloat(a.score)))
      .forEach((a, i) => {
        const scoreVal = parseFloat(a.score) || 0;
        const totalVal = parseFloat(a.totalPoints) || 100;

        const assignmentId = (a.objectSectionID || 'a') + "_" + i;
        const activeCatId = overrides[assignmentId] || "cat_default";

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

  // Always show IC's synced grade as primary
  const displayGrade = formatICGrade(course.grade);

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

  const handleSaveWeights = (e) => {
    e.preventDefault();
    const weightsObj = {};
    categories.forEach(c => {
      weightsObj[c.id] = { name: c.name, weight: parseFloat(c.weight) || 0 };
    });
    localStorage.setItem(`grade_calc_course_${course.id}_weights`, JSON.stringify(weightsObj));
    setIsEditingWeights(false);
  };

  const catNameChange = (id, newName) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };
  const catWeightChange = (id, newWeight) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, weight: newWeight } : c));
  };

  const handleMoveAssignment = (assignmentId, newCatId) => {
    const overrideJson = localStorage.getItem(`grade_calc_course_${course.id}_overrides`);
    const overrides = overrideJson ? JSON.parse(overrideJson) : {};
    overrides[assignmentId] = newCatId;
    localStorage.setItem(`grade_calc_course_${course.id}_overrides`, JSON.stringify(overrides));

    // Trigger re-render by updating dummy state, which will cause useEffect to re-run and rebuild categories
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="course-detail-container animate-slide-up">
      <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '1.5rem' }}>← Back to Dashboard</button>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>{course.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Term {course.term}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Grade</span><br />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{displayGrade}</span>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Assignments</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setIsEditingWeights(!isEditingWeights)} className="btn-secondary" style={{ width: 'auto' }}>
            {isEditingWeights ? "Cancel Edit" : "Configure Weights"}
          </button>
          <button onClick={() => setShowWhatIf(!showWhatIf)} className="btn-primary" style={{ width: 'auto' }}>
            + Add What-If
          </button>
        </div>
      </div>

      {isEditingWeights && (
        <div className="glass-card animate-slide-up" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Configure Category Weights</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>We detected the boundaries for your assignments, but your district hides the category names and weights. You can define them here once and we will save them forever!</p>
          <form onSubmit={handleSaveWeights}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ flex: '2' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category Name</label>
                  <input type="text" className="input-field" value={cat.name} onChange={(e) => catNameChange(cat.id, e.target.value)} required />
                </div>
                <div style={{ flex: '1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weight (Decimal, e.g. 0.8)</label>
                  <input type="number" step="0.01" max="1" min="0" className="input-field" value={cat.weight} onChange={(e) => catWeightChange(cat.id, e.target.value)} required />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button type="button" onClick={() => setCategories([...categories, { id: 'cat_' + Date.now(), name: 'New Category', weight: 0, assignments: [] }])} className="btn-secondary" style={{ width: 'auto' }}>+ Add Category</button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Categories</button>
            </div>
          </form>
        </div>
      )}

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
              <div key={a.id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: a.isFake ? '1px dashed var(--warning-color)' : '' }}>
                <div>
                  <span style={{ fontWeight: '500' }}>{a.name}</span>
                  {a.isFake && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--warning-color)', border: '1px solid var(--warning-color)', borderRadius: '4px', padding: '2px 6px' }}>What-If</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                  {!a.isFake && (
                    <select
                      value={cat.id}
                      onChange={(e) => handleMoveAssignment(a.id, e.target.value)}
                      style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>Move to {c.name}</option>)}
                    </select>
                  )}

                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{a.score} / {a.total_points}</span>
                  <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: 'bold' }}>{((a.score / Math.max(a.total_points, 0.001)) * 100).toFixed(1)}%</span>
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
      <FinalCalculator currentCourseGrade={isSetup ? parseFloat(computedGrade.toFixed(2)) : parseFloat(course.grade) || 100} />
    </div>
  );
}
