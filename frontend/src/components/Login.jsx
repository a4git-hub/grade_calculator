import React, { useState } from 'react';

export default function Login({ onLogin }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSyncForm, setShowSyncForm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            console.log("Launching Playwright interceptor on backend...");
            const res = await fetch('http://localhost:8001/api/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                throw new Error("Invalid credentials or server error");
            }

            const data = await res.json();
            console.log("SUCCESS! IC RAW DATA:", data);

            // Attempt to parse the first student's courses from the raw IC format
            let mappedData = null;
            if (data.status === "success" && data.data && data.data.length > 0) {
                const icStudent = data.data[0];
                const mappedCourses = (icStudent.courses || [])
                    .filter(c => {
                        const name = (c.courseName || c.name || "").toLowerCase();
                        return !name.includes("student support") && !name.includes("unscheduled");
                    })
                    .map(c => {
                        let grade = "N/A";
                        const targetID = c.sectionID; // STRICTLY sectionID, not rosterID!
                        let activeTermID = null;
                        let activeTermName = "Term S2";

                        // IC returns grades as a monolithic structure: [{courses: [{gradingTasks: [...]}]}]
                        // We need to flatten it to find the right grade for this section
                        if (icStudent.grades && Array.isArray(icStudent.grades)) {
                            let gradingTasks = [];

                            // Handle monolithic structure: grades[0].courses[].gradingTasks[]
                            if (icStudent.grades.length > 0 && icStudent.grades[0].courses) {
                                const enrollment = icStudent.grades[0];
                                for (const gc of enrollment.courses) {
                                    if (gc.sectionID === targetID) {
                                        gradingTasks = gc.gradingTasks || [];
                                        break;
                                    }
                                }
                            } else {
                                // Flat array fallback
                                gradingTasks = icStudent.grades.filter(g => g.sectionID === targetID);
                            }

                            // Grade priority: ALWAYS prefer the latest chronological term (T4 > T3 > T2)
                            // Within a term, prefer Semester > Quarter > Progress
                            const hasGrade = (g) => (g.progressPercent != null || g.percent != null);
                            const t4Grade = gradingTasks.find(g => g.termName === 'T4' && hasGrade(g) && g.taskName === 'Semester Grade') ||
                                gradingTasks.find(g => g.termName === 'T4' && hasGrade(g) && g.taskName === 'Quarter Grade') ||
                                gradingTasks.find(g => g.termName === 'T4' && hasGrade(g) && g.taskName === 'Progress Grade');

                            const t3Grade = gradingTasks.find(g => g.termName === 'T3' && hasGrade(g) && g.taskName === 'Semester Grade') ||
                                gradingTasks.find(g => g.termName === 'T3' && hasGrade(g) && g.taskName === 'Quarter Grade') ||
                                gradingTasks.find(g => g.termName === 'T3' && hasGrade(g) && g.taskName === 'Progress Grade');

                            const t2Grade = gradingTasks.find(g => g.termName === 'T2' && hasGrade(g) && g.taskName === 'Semester Grade') ||
                                gradingTasks.find(g => g.termName === 'T2' && hasGrade(g) && g.taskName === 'Quarter Grade') ||
                                gradingTasks.find(g => g.termName === 'T2' && hasGrade(g) && g.taskName === 'Progress Grade');

                            // Pick the latest chronological grade available
                            const bestTask = t4Grade || t3Grade || t2Grade || gradingTasks.find(hasGrade);

                            if (bestTask) {
                                grade = bestTask.progressPercent != null ? bestTask.progressPercent : bestTask.percent;
                                activeTermID = bestTask.termID;
                                // Display the semester name, not the individual term
                                const termNum = parseInt((bestTask.termName || '').replace('T', ''));
                                activeTermName = termNum >= 3 ? "S2" : "S1";
                            }
                        }

                        // Filter assignments for SEMESTER 2 (T3 + T4) since that's the current semester
                        // termID 3403=T3, 3404=T4 belong to semester 2
                        const sem2TermIDs = [3403, 3404]; // T3 and T4
                        const activeAssignments = (icStudent.assignments || []).filter(a => {
                            if (a.sectionID !== targetID) return false;
                            // Include assignments from any T3 or T4 term
                            if (a.termIDs && a.termIDs.some(t => sem2TermIDs.includes(t))) return true;
                            return false;
                        });

                        return {
                            id: targetID,
                            name: c.courseName || c.name,
                            grade: grade,
                            term: activeTermName,
                            assignments: activeAssignments,
                            rawCategories: icStudent.categories ? icStudent.categories.filter(cat => cat.sectionID === targetID) : []
                        };
                    });
                mappedData = {
                    student_name: icStudent.name || "Student",
                    courses: mappedCourses.length > 0 ? mappedCourses : null
                };
            }

            // Fallback to Mock Data if we couldn't parse any courses (so the UI doesn't crash while testing)
            if (!mappedData || !mappedData.courses) {
                console.warn("Could not parse courses from IC data. Falling back to mock data for UI demo.");
                mappedData = {
                    student_name: "Aditya (Mock)",
                    courses: [
                        { id: "1", name: "AP Computer Science A", grade: "96.5", term: "S2" },
                        { id: "2", name: "AP Calculus BC", grade: "88.2", term: "S2" },
                        { id: "3", name: "Physics Honors", grade: "92.0", term: "S2" },
                        { id: "4", name: "English Literature", grade: "94.1", term: "S2" }
                    ]
                };
            }

            onLogin(mappedData);
        } catch (err) {
            setError('Failed to connect to Infinite Campus. Check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!showSyncForm) {
        return (
            <div className="login-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '1rem', textShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}>Grade Calculator</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto' }}>Calculate final exam scores, model what-if scenarios, and track your GPA seamlessly.</p>
                </div>
                <button onClick={() => setShowSyncForm(true)} className="btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    Sync via ClassLink SSO
                </button>
            </div>
        );
    }

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel animate-slide-up" style={{ padding: '3rem', width: '100%', maxWidth: '450px', position: 'relative' }}>
                <button onClick={() => setShowSyncForm(false)} style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Secure Browser Login</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Because your school uses ClassLink SSO, typing a password here won't work. We will securely open a browser window for you to log in visually, then automatically safely sync your data.</p>

                {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
                    <button onClick={handleSubmit} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={isLoading}>
                        {isLoading ? 'Waiting for you to log in...' : 'Launch ClassLink Login Window'}
                    </button>
                    {isLoading && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Please check the newly opened browser window to log in. Once you see your grades, this page will instantly update.</p>}
                </div>
            </div>
        </div>
    );
}
