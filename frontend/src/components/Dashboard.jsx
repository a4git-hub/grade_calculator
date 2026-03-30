import React from 'react';

export default function Dashboard({ data, onSelectCourse, onLogout }) {
    if (!data || !data.courses) return null;

    // Calculate mock GPA
    const calculateGPA = (courses, weighted = false) => {
        if (!courses || courses.length === 0) return 0.0;
        let totalPoints = 0;
        courses.forEach(c => {
            const score = parseFloat(c.grade);
            let points = 0;
            if (score >= 90) points = 4.0;
            else if (score >= 80) points = 3.0;
            else if (score >= 70) points = 2.0;
            else if (score >= 60) points = 1.0;

            // Add weight for AP/Honors classes
            if (weighted && (c.name.includes('AP') || c.name.includes('Honors'))) {
                points += 1.0;
            }
            totalPoints += points;
        });
        return (totalPoints / courses.length).toFixed(2);
    };

    const unweightedGPA = calculateGPA(data.courses, false);
    const weightedGPA = calculateGPA(data.courses, true);

    // Determine motivation message
    const averageGrade = data.courses.reduce((acc, c) => acc + parseFloat(c.grade), 0) / data.courses.length;
    let motivationMessage = "Keep pushing forward!";
    if (averageGrade >= 90) motivationMessage = "You're doing amazing, keep it up! 🚀";
    else if (averageGrade >= 80) motivationMessage = "Solid work, maintaining a strong B average! 💪";

    return (
        <div className="dashboard-container animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'var(--primary-color)' }}>Welcome back, {data.student_name}!</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{motivationMessage}</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GPA (UW/W)</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{unweightedGPA} / <span style={{ color: 'var(--primary-color)' }}>{weightedGPA}</span></div>
                    </div>
                    <button onClick={onLogout} className="btn-secondary">Sign Out</button>
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
                                <span className={gradeClass} style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {course.grade}%
                                </span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* Mock Needs Attention Data - in a real app this would map over filtered data.assignments */}
                {[
                    { course: 'AP Calculus BC', name: 'Chapter 4 Quiz', score: 6.5, total: 10, type: 'Low Score' },
                    { course: 'Physics Honors', name: 'Lab Report 3', score: 0, total: 20, type: 'Missing' },
                    { course: 'English Literature', name: 'Reading Log', score: 5, total: 10, type: 'Low Score' }
                ].map((item, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: '1rem', borderLeft: `4px solid var(--${item.type === 'Missing' ? 'danger' : 'warning'}-color)` }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{item.course}</div>
                        <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{item.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', background: `rgba(${item.type === 'Missing' ? '239, 68, 68' : '245, 158, 11'}, 0.1)`, color: `var(--${item.type === 'Missing' ? 'danger' : 'warning'}-color)` }}>
                                {item.type}
                            </span>
                            <span style={{ fontFamily: 'monospace' }}>{item.score} / {item.total}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
