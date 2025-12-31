
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const refineScript = async (topic: string, currentContent: string): Promise<string> => {
  const prompt = `
    You are an expert interview coach. 
    The user wants to refine an interview answer or script for: "${topic}".
    Current draft: "${currentContent}"
    
    Tasks:
    1. Make it conversational, punchy, and memorable.
    2. Use Alex Hormozi's style: direct, value-driven, and clear.
    3. Keep it to a length that is comfortable to speak in 60-90 seconds.
    4. Focus on "Problem-Action-Result" or "STAR" method.
    
    Return ONLY the improved script text. No preamble or meta-commentary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || currentContent;
  } catch (error) {
    console.error("Gemini Error:", error);
    return currentContent;
  }
};

export const generateInterviewAnswer = async (question: string): Promise<string> => {
  const prompt = `
    Create a world-class interview script for the following question: "${question}".
    Style: High-authority, results-oriented, and charismatic.
    Format: A conversational script ready for memorization.
    Return ONLY the script text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Failed to generate answer. Please try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI. Please check your connection.";
  }
};
