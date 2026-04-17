import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Gemini API using the secure Vercel environment variable
// NEVER hardcode an API key in a public file!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { student_data, user_message } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ reply: "Server error: Gemini API Key is missing from the environment variables." });
        }

        // Initialize the super-fast Gemini Flash model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are Lumina, a highly intelligent and encouraging academic advisor AI built into a Grade Calculator iOS App. 
            Here is the live data of the student's Infinite Campus grades:
            ${JSON.stringify(student_data, null, 2)}
            
            The student says: "${user_message}"
            
            Respond directly to the student in a helpful, concise, and mathematical way. Do not output raw JSON, just write a conversational response.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return res.status(200).json({ reply: responseText });
    } catch (error) {
        console.error("AI Error:", error);
        return res.status(500).json({ reply: `API Error: ${error.message}` });
    }
}
