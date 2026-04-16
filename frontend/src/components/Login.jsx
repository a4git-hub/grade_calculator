import { Capacitor } from '@capacitor/core';
import React, { useState, useEffect } from 'react';

export default function Login({ onLogin, autoSync = false }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSyncForm, setShowSyncForm] = useState(false);

    useEffect(() => {
        if (autoSync && !isLoading) {
            setShowSyncForm(true);
            handleSubmit({ preventDefault: () => {} });
        }
    }, [autoSync]);

    const handleDemoLogin = () => {
        onLogin({
            student_name: "Apple Reviewer (Demo)",
            courses: [
                { id: "1", name: "AP Computer Science A", grade: "96.5", term: "S2", assignments: [], rawCategories: [] },
                { id: "2", name: "AP Calculus BC", grade: "88.2", term: "S2", assignments: [], rawCategories: [] },
                { id: "3", name: "Physics Honors", grade: "92.0", term: "S2", assignments: [], rawCategories: [] },
                { id: "4", name: "English Literature", grade: "94.1", term: "S2", assignments: [], rawCategories: [] }
            ]
        });
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const isNative = Capacitor.isNativePlatform();
            let data = null;

            if (isNative) {
                console.log("Launching Native Web Scraper Bridge...");
                
                // Ensure Cordova plugin is successfully registered by Capacitor
                if (!window.cordova || !window.cordova.InAppBrowser) {
                     throw new Error("Native Scraper Plugin missing. Please rebuild Xcode project after syncing.");
                }

                data = await new Promise((resolve, reject) => {
                    const browser = window.cordova.InAppBrowser.open('https://srvusd.infinitecampus.org/campus/portal/students/sanRamon.jsp', '_blank', 'location=no,toolbar=yes');

                    browser.addEventListener('loadstop', (event) => {
                        console.log("Native WebView Reached:", event.url);

                        // Enforce single-line script injection to avoid Cordova JSON bridge parser failures (INVALID).
                        // Also force all SAML <form> targets to _self so Classlink Azure OIDC doesn't hit a blocked popup!
                        browser.executeScript({ 
                            code: "document.querySelectorAll('form').forEach(function(f){f.target='_self'}); document.querySelectorAll('a').forEach(function(a){a.target='_self'}); window.open=function(u){window.location.href=u;return null;}; true;" 
                        });

                        if (event.url && event.url.toLowerCase().includes('infinitecampus.org')) {
                            // Aggressive Multi-Heuristic Scraper targeting the Infinite Campus personID
                            const scraperCode = `
                            if (!window.ic_running) {
                                window.ic_running = true;
                                localStorage.removeItem('ic_intercepted_grades');
                                
                                // Heuristic 4: Background Network Monkey Patch
                                window.ic_intercepted_pId = null;
                                var oldOpen = XMLHttpRequest.prototype.open;
                                XMLHttpRequest.prototype.open = function(method, url) {
                                    if(url && typeof url === 'string') {
                                        var m = url.match(/personID=(\\d+)/i);
                                        if(m && m[1]) window.ic_intercepted_pId = m[1];
                                    }
                                    oldOpen.apply(this, arguments);
                                };
                                var oldFetch = window.fetch;
                                window.fetch = async function() {
                                    if(arguments[0] && typeof arguments[0] === 'string') {
                                        var m = arguments[0].match(/personID=(\\d+)/i);
                                        if(m && m[1]) window.ic_intercepted_pId = m[1];
                                    }
                                    return oldFetch.apply(this, arguments);
                                };
                                
                                let attempts = 0;
                                var timer = setInterval(async function() {
                                    attempts++;
                                    let pId = window.ic_intercepted_pId;
                                    
                                    try {
                                        // Heuristic 1: Raw HTML String Regex
                                        if (!pId) {
                                            var htmlStr = document.documentElement.innerHTML;
                                            var match = htmlStr.match(/personID['"\\\\]*\\s*[:=]\\s*['"\\\\]*(\\d+)/i) || 
                                                        htmlStr.match(/personID=["'](\\d+)["']/i);
                                                        
                                            if (match && match[1]) pId = match[1];
                                        } 
                                        
                                        // Heuristic 2: Hidden DOM Links
                                        if (!pId) {
                                            var links = document.querySelectorAll('a[href*="personID="]');
                                            if (links.length > 0) {
                                                var hrefMatch = links[0].href.match(/personID=(\\d+)/i);
                                                if (hrefMatch && hrefMatch[1]) pId = hrefMatch[1];
                                            }
                                        }
                                        
                                        // Heuristic 3: Blind API fetch to student listing
                                        if (!pId) {
                                            try {
                                                var bUrl = 'https://srvusd.infinitecampus.org';
                                                var sRes = await oldFetch(bUrl + '/campus/resources/portal/students', {headers: {'Accept':'application/json'}});
                                                if(sRes.ok) {
                                                    var sData = await sRes.json();
                                                    if(Array.isArray(sData) && sData.length > 0 && sData[0].personID) {
                                                        pId = sData[0].personID;
                                                    }
                                                }
                                            } catch(e) {}
                                        }

                                        if (pId) {
                                            clearInterval(timer);
                                            var hdrs = { 'Accept': 'application/json' };
                                            var bUrl = 'https://srvusd.infinitecampus.org';
                                            
                                            // Execute Extraction Payload!
                                            var dynamicName = 'Student';
                                            try {
                                                var sRes2 = await oldFetch(bUrl + '/campus/resources/portal/students', { headers: hdrs });
                                                if (sRes2.ok) {
                                                    var sData2 = await sRes2.json();
                                                    var me = sData2.find(s => String(s.personID) === String(pId));
                                                    if (me && me.firstName) dynamicName = me.firstName;
                                                    else if (sData2.length > 0 && sData2[0].firstName) dynamicName = sData2[0].firstName;
                                                }
                                            } catch(e) {}
                                            
                                            var rosterRes = await oldFetch(bUrl + '/campus/resources/portal/roster?&personID=' + pId, { headers: hdrs });
                                            var roster = await rosterRes.json();
                                            
                                            var assignRes = await oldFetch(bUrl + '/campus/api/portal/assignment/listView?&personID=' + pId, { headers: hdrs });
                                            var assign = await assignRes.json();
                                            
                                            var grades = [];
                                            var gRes = await oldFetch(bUrl + '/campus/resources/portal/grades', { headers: hdrs });
                                            if (gRes.ok) {
                                                var gData = await gRes.json();
                                                if (Array.isArray(gData) && gData.length > 0 && gData[0].courses) {
                                                    grades = gData;
                                                } else {
                                                    var gRes2 = await oldFetch(bUrl + '/campus/api/portal/grades?personID=' + pId, { headers: hdrs });
                                                    if (gRes2.ok) grades = await gRes2.json();
                                                }
                                            }
                                            
                                            var cats = [];
                                            var dets = [];
                                            for (var i = 0; i < roster.length; i++) {
                                                var c = roster[i];
                                                if (c.sectionID) {
                                                    var cRes = await oldFetch(bUrl + '/campus/api/instruction/categories?sectionID=' + c.sectionID, { headers: hdrs });
                                                    if (cRes.ok) {
                                                        var cData = await cRes.json();
                                                        if (Array.isArray(cData)) cats.push(...cData);
                                                    }
                                                    var dRes = await oldFetch(bUrl + '/campus/resources/portal/grades/detail/' + c.sectionID + '?showAllTerms=false&classroomSectionID=' + c.sectionID, { headers: hdrs });
                                                    if (dRes.ok) dets.push({ sectionID: c.sectionID, data: await dRes.json() });
                                                }
                                            }
                                            
                                            var payload = { name: dynamicName, student_id: pId, courses: roster, assignments: assign || [], grades: grades || [], categories: cats, detail_data: dets };
                                            localStorage.setItem('ic_intercepted_grades', JSON.stringify({ status: 'success', data: [payload] }));
                                        } else if (attempts > 15) {
                                            clearInterval(timer);
                                            localStorage.setItem('ic_intercepted_grades', JSON.stringify({ status: 'error', message: 'Could not find Student ID in page source.' }));
                                        }
                                    } catch (err) {
                                        clearInterval(timer);
                                        localStorage.setItem('ic_intercepted_grades', JSON.stringify({ status: 'error', message: err.toString() }));
                                    }
                                }, 1000);
                            }; true;`;
                            // Minify line breaks just for the exec string
                            browser.executeScript({ code: scraperCode.replace(/\\n/g, ' ') });
                        }
                    });

                    // Outside of the load event, we check if the local polling was successful and resolved securely!
                    const nativePollInterval = setInterval(() => {
                        browser.executeScript({ code: "localStorage.getItem('ic_intercepted_grades');" }, (values) => {
                            if (values && values.length > 0) {
                                const rawStr = values[0];
                                if (rawStr && rawStr !== "null") {
                                    clearInterval(nativePollInterval);
                                    browser.close();
                                    try {
                                        const parsed = JSON.parse(rawStr);
                                        if (parsed.status === "error") reject(new Error(parsed.message));
                                        else resolve(parsed);
                                    } catch (e) {
                                        reject(new Error("Failed to parse intercepted grade data"));
                                    }
                                }
                            }
                        });
                    }, 500);

                    browser.addEventListener('exit', () => {
                        clearInterval(nativePollInterval);
                        reject(new Error("Login window closed before sync completed."));
                    });
                });
            } else {
                console.log("Launching Playwright interceptor on backend...");
                const res = await fetch('http://localhost:8001/api/grades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!res.ok) {
                    throw new Error("Invalid credentials or server error");
                }
                data = await res.json();
            }

            console.log("SUCCESS! IC RAW DATA:", data);

            // Attempt to parse the first student's courses from the raw IC format
            let mappedData = null;
            if (data && data.status === "success" && data.data && data.data.length > 0) {
                const icStudent = data.data[0];
                const safeCourses = Array.isArray(icStudent.courses) ? icStudent.courses : [];
                const mappedCourses = safeCourses
                    .filter(c => {
                        const name = (c.courseName || c.name || "").toLowerCase();
                        return !name.includes("student support") && !name.includes("unscheduled");
                    })
                    .map(c => {
                        let grade = "N/A";
                        let officialLetter = null;
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
                                officialLetter = bestTask.progressScore != null ? bestTask.progressScore : bestTask.score;
                                activeTermID = bestTask.termID;
                                // Display the semester name, not the individual term
                                const termNum = parseInt((bestTask.termName || '').replace('T', ''));
                                activeTermName = termNum >= 3 ? "S2" : "S1";
                            }
                        }

                        // Clean up official letter (sometimes IC sends it as ' A ' or similar)
                        if (officialLetter && typeof officialLetter === 'string') {
                            officialLetter = officialLetter.trim();
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
                            letterGrade: officialLetter,
                            term: activeTermName,
                            assignments: activeAssignments,
                            rawCategories: icStudent.categories ? icStudent.categories.filter(cat => cat.sectionID === targetID) : [],
                            detailData: icStudent.detail_data ? icStudent.detail_data.find(d => String(d.sectionID) === String(targetID)) : null
                        };
                    });
                mappedData = {
                    student_name: icStudent.name || "Student",
                    courses: mappedCourses.length > 0 ? mappedCourses : null
                };
            }

            if (!mappedData || !mappedData.courses) {
                throw new Error("Could not parse valid courses from raw data.");
            }

            onLogin(mappedData);
        } catch (err) {
            setError(err.message || 'Failed to connect to Infinite Campus. Check your credentials.');
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

                {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center', border: '1px solid var(--danger-color)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
                    <button onClick={handleSubmit} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={isLoading}>
                        {isLoading ? 'Waiting for you to log in...' : 'Launch ClassLink Login Window'}
                    </button>
                    {isLoading && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Please check the newly opened browser window to log in. Once you see your grades, this page will instantly update.</p>}
                    
                    <p 
                        onClick={handleDemoLogin} 
                        style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', marginTop: '1rem' }}
                    >
                        App Reviewer? Use Demo Login
                    </p>
                </div>
            </div>
        </div>
    );
}
