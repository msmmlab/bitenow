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

    // Prepare content parts
    const parts: any[] = [
        {
            text: `
    You are the BiteNow AI Curator. A restaurant owner has sent a message (and possibly photos of a chalkboard or menu).
    Analyze the following content and categorize it.
    
    TEXT_CONTENT:
    "${text}"

    INSTRUCTIONS:
    1. If it's a daily special or deal (e.g., "$25 Steak", "Happy Hour 4-6pm"), set type to 'special'.
    2. Extract a punchy 'title' (max 40 chars) and a 'description'. Include the price if found.
    3. If there are images, look for handwritten or printed specials/deals on them.
    4. If it's a general question or support request, set type to 'question'.
    5. Otherwise, set type to 'other'.
    6. Always provide a friendly 'response' string that we can text back to the owner. Use emojis!
    
    If it's a special, the description should include the time/day if mentioned.

    Return ONLY a JSON object with this structure:
    {
      "type": "special" | "question" | "other",
      "specialData": { "title": "...", "description": "...", "price": "..." },
      "response": "..."
    }
    `
        }
    ];

    // Add images if any
    if (imageUrls.length > 0) {
        for (const url of imageUrls) {
            try {
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                parts.push({
                    inlineData: {
                        data: Buffer.from(buffer).toString("base64"),
                        mimeType: "image/jpeg" // Twilio images are usually jpg
                    }
                });
            } catch (e) {
                console.error("Failed to fetch image for Gemini:", url, e);
            }
        }
    }

    try {
        const result = await model.generateContent(parts);
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
