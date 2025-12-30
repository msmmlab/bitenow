import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export interface SMSAnalysis {
    type: 'special' | 'question' | 'other';
    specialData?: {
        title: string;
        description: string;
        price?: string;
    };
    response: string;
}

export async function analyzeSMS(text: string, imageUrls: string[] = []): Promise<SMSAnalysis> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are the BiteNow AI Curator. A restaurant owner has sent a message (and possibly photos of a chalkboard or menu).
    Analyze the following content and categorize it.
    
    CONTENT:
    "${text}"
    
    IMAGE_URLS:
    ${imageUrls.join('\n')}

    INSTRUCTIONS:
    1. If it's a daily special or deal (e.g., "$25 Steak", "Happy Hour 4-6pm"), set type to 'special'.
    2. Extract a punchy 'title' (max 40 chars) and a 'description'. Include the price if found.
    3. If it's a general question or support request, set type to 'question'.
    4. Otherwise, set type to 'other'.
    5. Always provide a friendly 'response' string that we can text back to the owner.

    Return ONLY a JSON object with this structure:
    {
      "type": "special" | "question" | "other",
      "specialData": { "title": "...", "description": "...", "price": "..." },
      "response": "..."
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return {
            type: 'other',
            response: "Sorry, I'm having trouble reading that. Could you try again or send a clearer photo?"
        };
    }
}
