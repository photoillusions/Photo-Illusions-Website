import { GoogleGenAI } from "@google/genai";

// Safely pulls the key from Render's environment variables
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generatePhotoboothStrip = async (prompt: string): Promise<string> => {
  try {
    const fullPrompt = `Generate a realistic photobooth strip containing 3 vertical photo frames of ${prompt}. 
    Style: High contrast black and white photography, studio lighting, fun party atmosphere. 
    The images should look like they were taken in a professional photobooth. 
    Do not include text inside the photos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: fullPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16", // Vertical strip style
        }
      }
    });

    let imageUrl = '';
    
    // Iterate through parts to find the image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break; 
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image generated.");
    }

    return imageUrl;

  } catch (error) {
    console.error("Error generating photobooth strip:", error);
    throw error;
  }
};