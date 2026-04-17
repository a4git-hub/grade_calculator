import React, { useState } from 'react';
import { getLetterGrade } from '../utils/mathEngine';
import AiAdvisor from './AiAdvisor';

export default function Dashboard({ data, onSelectCourse, onLogout, onRefresh }) {
    const [showAi, setShowAi] = useState(false);
    if (!data || !data.courses) return null;

    // Calculate realistic GPA
    const calculateGPA = (courses, weighted = false) => {
        if (!courses || courses.length === 0) return 0.0;
        let totalPoints = 0;
        let validCourses = 0;
        
        courses.forEach(c => {
            const score = parseFloat(c.grade);
            if (isNaN(score)) return; // Skip N/A courses
            
            validCourses++;
            let points = 0;
            if (score >= 89.5) points = 4.0;
            else if (score >= 79.5) points = 3.0;
            else if (score >= 69.5) points = 2.0;
            else if (score >= 59.5) points = 1.0;

            // Add weight for AP/Honors/Accelerated classes
            if (weighted && (c.name.includes('AP') || c.name.includes('Honors') || c.name.includes('Accel'))) {
                points += 1.0;
            }
            totalPoints += points;
        });
        
        if (validCourses === 0) return 0.0;
        return (totalPoints / validCourses).toFixed(2);
    };

    const unweightedGPA = calculateGPA(data.courses, false);
    const weightedGPA = calculateGPA(data.courses, true);

    // Determine motivation message
    const averageGrade = data.courses.reduce((acc, c) => acc + parseFloat(c.grade), 0) / data.courses.length;
    let motivationMessage = "Keep pushing forward!";
    if (averageGrade >= 90) motivationMessage = "You're doing amazing, keep it up! 🚀";
    else if (averageGrade >= 80) motivationMessage = "Solid work, maintaining a strong B average! 💪";

    // Build Dynamic Needs Attention List
    const needsAttentionItems = [];
    data.courses.forEach(course => {
        if (!course.assignments) return;
        course.assignments.forEach(a => {
            if (a.missing || (a.score === null && a.late)) {
                needsAttentionItems.push({ course: course.name, name: a.assignmentName || 'Assignment', score: 0, total: a.totalPoints || '-', type: 'Missing' });
            } else if (a.score !== null && !isNaN(parseFloat(a.score))) {
                const s = parseFloat(a.score);
                const t = parseFloat(a.totalPoints) || 100;
                if (t > 0 && (s / t) <= 0.70) {
                    needsAttentionItems.push({ course: course.name, name: a.assignmentName || 'Assignment', score: s, total: t, type: 'Low Score' });
                }
            }
        });
    });
    // Sort so most recent issues tend to surface (assuming array order)
    needsAttentionItems.sort((a,b) => b.type.localeCompare(a.type));

    return (
        <>
        <div className="dashboard-container animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'var(--primary-color)' }}>Welcome back, {(data.student_name || '').split(' (')[0]}!</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{motivationMessage}</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GPA (UW/W)</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{unweightedGPA} / <span style={{ color: 'var(--primary-color)' }}>{weightedGPA}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={onRefresh} className="btn-secondary" style={{ padding: '0.5rem' }} title="Refresh Grades">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        </button>
                        <button onClick={onLogout} className="btn-secondary">Sign Out</button>
                    </div>
                </div>
            </div >

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {data.courses.map((course) => {
                    // Determine grade color
                    const score = parseFloat(course.grade);
                    let gradeClass = 'grade-A';
                    if (score < 90) gradeClass = 'grade-B';
                    if (score < 80) gradeClass = 'grade-C';
                    if (score < 70) gradeClass = 'grade-D';
                    if (score < 60) gradeClass = 'grade-F';

                    return (
                        <div
                            key={course.id}
                            className="glass-card"
                            style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                            onClick={() => onSelectCourse(course)}
                        >
                            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{course.name}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Term {course.term}</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span className={gradeClass} style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: '1' }}>
                                        {course.letterGrade || getLetterGrade(score)}
                                    </span>
                                    <span style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: '1', color: 'var(--text-secondary)' }}>
                                        -
                                    </span>
                                    <span className={gradeClass} style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: '1' }}>
                                        {isNaN(score) ? 'N/A' : `${score}%`}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar Visual */}
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${Math.min(100, score)}%`,
                                        background: `var(--${gradeClass === 'grade-A' ? 'success' : gradeClass === 'grade-B' ? 'primary' : gradeClass === 'grade-C' ? 'warning' : 'danger'}-color)`,
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div >

            <h2 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Needs Attention</h2>
            {needsAttentionItems.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    You have no missing or failing assignments. Great job! 🎉
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {needsAttentionItems.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="glass-card" style={{ padding: '1rem', borderLeft: `4px solid var(--${item.type === 'Missing' ? 'danger' : 'warning'}-color)` }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{item.course}</div>
                            <div style={{ fontWeight: '500', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', background: `rgba(${item.type === 'Missing' ? '239, 68, 68' : '245, 158, 11'}, 0.1)`, color: `var(--${item.type === 'Missing' ? 'danger' : 'warning'}-color)` }}>
                                    {item.type}
                                </span>
                                <span style={{ fontFamily: 'monospace' }}>{item.score} / {item.total}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>

        {/* AI Advisor Floating Action Button — fixed to viewport, outside scroll container */}
        <button 
            onClick={() => setShowAi(!showAi)}
            style={{
               position: 'fixed',
               bottom: '28px',
               right: '24px',
               width: '60px',
               height: '60px',
               borderRadius: '50%',
               background: 'linear-gradient(135deg, var(--primary-color), #8b5cf6)',
               color: 'white',
               border: 'none',
               boxShadow: '0 4px 20px rgba(99, 102, 241, 0.6)',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 9998,
               transition: 'transform 0.2s ease, box-shadow 0.2s ease',
               transform: showAi ? 'scale(0.9)' : 'scale(1)'
            }}
            title="Ask Lumina AI"
        >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L19 7L14.74 11.26L21 12L14.74 12.74L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.74L3 12L9.26 11.26L5 7L10.91 8.26L12 2Z"/>
            </svg>
        </button>

        {/* AI Advisor Modal */}
        {showAi && (
            <AiAdvisor courses={data.courses} onClose={() => setShowAi(false)} />
        )}
        </>
    );
}
