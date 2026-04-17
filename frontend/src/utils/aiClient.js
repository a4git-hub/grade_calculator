export async function getAiResponse(fullGradeData, userMessage, history = []) {
    // 1. Condense the massive IC JSON into a lightweight clean object
    // This prevents hitting the LLM token limits and saves money
    const condensedGrades = (fullGradeData || []).map(c => {
        // Pull categories from rawCategories (the correct field on the course object)
        const rawCats = c.rawCategories || [];
        const detailCats = (c.detailData?.data?.details || [])
            .flatMap(t => t.categories || []);
        
        // Prefer detail categories (they have weights), fallback to rawCategories
        const catSource = detailCats.length > 0 ? detailCats : rawCats;
        const categories = catSource.map(cat => ({
            name: cat.name,
            weight: cat.weight ? `${parseFloat(cat.weight)}%` : 'N/A'
        }));

        return {
            course: c.courseName || c.name || "Unknown",
            current_grade: parseFloat(c.grade) || "N/A",
            categories,
            // Pull the 5 most recent graded assignments for this course
            recent_assignments: (c.assignments || [])
               .filter(a => a.score != null && a.score !== '')
               .slice(0, 5)
               .map(a => ({
                   name: a.assignmentName,
                   score: a.score,
                   total: a.totalPoints
               }))
        };
    });

    const payload = {
        student_data: condensedGrades,
        user_message: userMessage,
        // Send last 10 messages (skip the first AI greeting) for memory context
        history: history.slice(1, -1).slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
        }))
    };

    // 2. Fetch from the future Serverless API
    try {
        const response = await fetch('https://grade-calculator-one-flax.vercel.app/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            return data.reply || "Server disconnected.";
        }

        return data.reply;
    } catch (e) {
        // Fallback mockup response so the UI works right now
        console.warn("AI Backend not reached (expected if server isn't running yet).", e);
        return "Hey! I'm Lumina AI. I can see your grades, but my backend server isn't turned on yet. Tell your friend to deploy the Vercel API and swap out the 'localhost' URL in `aiClient.js`!";
    }
}
