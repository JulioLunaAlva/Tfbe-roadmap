import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    console.warn('[Gemini] GEMINI_API_KEY not set. AI features will be unavailable.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// gemini-2.0-flash: current stable model, fast and free tier
const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        temperature: 0.4,      // Balanced: creative but consistent
        maxOutputTokens: 2048,
    },
});

/**
 * Send a prompt to Gemini and get a text response.
 * Throws if the API key is missing or the call fails.
 */
export async function askGemini(prompt: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured.');
    }
    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Helper: extract the first JSON object from a Gemini response.
 * Gemini sometimes wraps JSON in markdown code fences.
 */
export function extractJSON<T>(raw: string): T {
    // Try to strip ```json ... ``` markdown code fences
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenced ? fenced[1] : raw;
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in Gemini response');
    return JSON.parse(match[0]) as T;
}
