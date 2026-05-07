import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  condition: string;
  summary: string;
  recommendedSpecialty: string;
  vitalMarkers: { name: string; value: string; status: 'normal' | 'high' | 'low' }[];
}

export const analyzeReport = async (text: string): Promise<AnalysisResult> => {
  const prompt = `Analyze the following medical report text and extract key findings. 
  Identify the main condition, provide a brief summary, suggest a recommended doctor specialty (e.g., Cardiologist, Diabetologist, etc.), 
  and list vital markers found with their status.
  
  Report Text:
  ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          condition: { type: Type.STRING },
          summary: { type: Type.STRING },
          recommendedSpecialty: { type: Type.STRING },
          vitalMarkers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['normal', 'high', 'low'] }
              },
              required: ['name', 'value', 'status']
            }
          }
        },
        required: ['condition', 'summary', 'recommendedSpecialty', 'vitalMarkers']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
