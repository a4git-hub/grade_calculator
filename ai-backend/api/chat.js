import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Simple in-memory rate limiter: max 10 requests per minute per IP
const rateLimitMap = new Map();
function isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 10;
    const entry = rateLimitMap.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
        rateLimitMap.set(ip, { count: 1, start: now });
        return false;
    }
    if (entry.count >= maxRequests) return true;
    entry.count++;
    rateLimitMap.set(ip, entry);
    return false;
}

// Only Lumina domains can call this API
const ALLOWED_ORIGINS = [
    'https://grade-calculator-one-flax.vercel.app',
    'https://lumina-grades.base44.app',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost:5173',
    'http://localhost:3000'
];

export default async function handler(req, res) {
    const origin = req.headers.origin || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
        return res.status(429).json({ reply: "Too many requests. Please slow down and try again in a minute." });
    }

    try {
        const { student_data, user_message, history, syllabus } = req.body;

        // Input validation
        if (!user_message || typeof user_message !== 'string') {
            return res.status(400).json({ reply: "Invalid request." });
        }
        if (user_message.length > 500) {
            return res.status(400).json({ reply: "Message too long. Please keep it under 500 characters." });
        }
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ reply: "Server configuration error." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemContext = `You are Lumina, a highly intelligent and encouraging academic advisor AI built into a Grade Calculator iOS App. 
Here is the live data of the student's Infinite Campus grades:
${JSON.stringify(student_data, null, 2)}

Respond directly to the student in a helpful, concise, and mathematical way. Do not output raw JSON, just write a conversational response. Do NOT greet the user on every single message — only greet them on the very first message.`;

        const systemParts = [{ text: systemContext }];

        let activeMessageParts = [{ text: user_message }];

        if (syllabus) {
            const match = syllabus.match(/^data:(.*?);base64,(.*)$/);
            if (match) {
                const mimeType = match[1];
                const base64Data = match[2];
                activeMessageParts.push({ text: "Here is the course syllabus that applies to the grades:" });
                activeMessageParts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            }
        }

        const chatHistory = (history || []).map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: systemParts },
                { role: 'model', parts: [{ text: "Understood! I'm ready to help analyze grades and the syllabus." }] },
                ...chatHistory
            ]
        });

        const result = await chat.sendMessage(activeMessageParts);
        return res.status(200).json({ reply: result.response.text() });

    } catch (error) {
        console.error("AI Error:", error);
        return res.status(500).json({ reply: "Something went wrong. Please try again." });
    }
}
