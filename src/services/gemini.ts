// Direct REST API implementation - Optimized for speed

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const generateAnswer = async (apiKey: string, context: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key is required");
    if (!context) return "";

    // Prioritize fastest models
    const modelsToTry = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-3-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ];

    // Prompt for comprehensive answers
    const prompt = `You are an expert interview assistant. The user is in an interview and needs help answering.

What the interviewer said: "${context}"

IMPORTANT: Always provide a helpful answer based on the transcript above. Do NOT say "Listening for question" - assume whatever is in the transcript is something that needs a response.

Provide a comprehensive answer:
- Direct Answer (1-2 sentences addressing the main point)
- Key Points (3-5 bullet points with details)
- Example if applicable

Be thorough but practical. Aim for 200-300 words.`;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
            topP: 0.9,
            topK: 40
        }
    };

    const errors: string[] = [];

    for (const model of modelsToTry) {
        try {
            console.log(`Trying: ${model}`);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(
                `${API_BASE}/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                }
            );

            clearTimeout(timeout);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`[${response.status}] ${data.error?.message || 'Unknown error'}`);
            }

            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text && data.candidates?.[0]?.text) {
                text = data.candidates[0].text;
            }

            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                throw new Error("Blocked by safety filters");
            }

            if (text) {
                console.log(`✓ Success with ${model}`);
                return text;
            }

            throw new Error("No text in response");
        } catch (error: any) {
            if (error.name === 'AbortError') {
                errors.push(`[${model}]: Timeout`);
            } else {
                errors.push(`[${model}]: ${error.message}`);
            }
            console.warn(`✗ ${model} failed`);
        }
    }

    const quotaError = errors.find(e => e.includes("429") || e.includes("quota"));
    if (quotaError) {
        throw new Error(`Quota exceeded. Try again in a minute.`);
    }

    throw new Error(`All models failed:\n${errors.join('\n')}`);
};

export const listAvailableModels = async (apiKey: string): Promise<string[]> => {
    try {
        const response = await fetch(`${API_BASE}/models?key=${apiKey}`);
        const data = await response.json();
        if (!response.ok) return [];
        return data.models
            ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            ?.map((m: any) => m.name.replace('models/', '')) || [];
    } catch {
        return [];
    }
};
