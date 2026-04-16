export async function getAiResponse(fullGradeData, userMessage) {
    // 1. Condense the massive IC JSON into a lightweight clean object
    // This prevents hitting the LLM token limits and saves money
    const condensedGrades = (fullGradeData || []).map(c => {
        return {
            course: c.courseName || c.name || "Unknown",
            current_grade: parseFloat(c.grade) || "N/A",
            // We only send the names and weights of categories so the AI can do math
            categories: (c.categories || []).map(cat => ({
                name: cat.name,
                weight: cat.weight
            })),
            // We only send the 5 most recent assignments to save tokens
            recent_assignments: (fullGradeData.assignments || [])
               .filter(a => a.sectionID === c.sectionID)
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
        user_message: userMessage
    };

    // 2. Fetch from the future Serverless API
    try {
        // TODO: Replace this with your friend's Vercel URL once he deploys it!
        // Example: 'https://lumina-ai-backend.vercel.app/api/chat'
        const response = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("API Offline");
        }

        const data = await response.json();
        return data.reply;
    } catch (e) {
        // Fallback mockup response so the UI works right now
        console.warn("AI Backend not reached (expected if server isn't running yet).", e);
        return "Hey! I'm Lumina AI. I can see your grades, but my backend server isn't turned on yet. Tell your friend to deploy the Vercel API and swap out the 'localhost' URL in `aiClient.js`!";
    }
}
