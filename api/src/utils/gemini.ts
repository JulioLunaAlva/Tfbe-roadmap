import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
    console.warn('[Gemini] GEMINI_API_KEY not set. AI features will be unavailable.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// gemini-3.7-flash: current model (August 2026), fast and free tier
const MODEL = 'gemini-3.7-flash';

/**
 * Send a prompt to Gemini and get a text response.
 * Throws if the API key is missing or the call fails.
 */
export async function askGemini(prompt: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured.');
    }
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            temperature: 0.4,
            maxOutputTokens: 2048,
        },
    });
    return response.text ?? '';
}

/**
 * Helper: extract the first JSON object from a Gemini response.
 * Gemini sometimes wraps JSON in markdown code fences.
 */
export function extractJSON<T>(raw: string): T {
    // Strip ```json ... ``` markdown code fences
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenced ? fenced[1] : raw;
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in Gemini response');
    return JSON.parse(match[0]) as T;
}
