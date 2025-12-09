import { GoogleGenAI } from "@google/genai";
import { EnhanceStyle } from "../types";
import { STYLES, SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async enhanceImage(
    imageBase64: string,
    style: EnhanceStyle,
    customPrompt?: string
  ): Promise<string> {
    try {
      // Detect MIME type dynamically from the Data URL
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      
      let promptText = "";

      if (style === EnhanceStyle.Custom && customPrompt) {
        promptText = `Retouch this image based on the following instruction: ${customPrompt}. Ensure you maintain high-quality skin texture and do not alter the background identity.`;
      } else {
        const selectedStyle = STYLES.find(s => s.id === style);
        promptText = selectedStyle ? selectedStyle.prompt : STYLES[0].prompt;
        
        if (customPrompt) {
          promptText += ` \nAdditional Instruction: ${customPrompt}`;
        }
      }

      // Explicitly configure safety settings to BLOCK_NONE for all categories
      // This is crucial for skin retouching apps as close-ups can trigger false positives
      const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ];

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            },
            {
              text: promptText
            }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          safetySettings: safetySettings,
        }
      });

      const candidate = response.candidates?.[0];
      
      // Handle cases where generation was blocked or empty
      if (!candidate) {
        throw new Error("No candidates returned. The request may have failed.");
      }

      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
         // If blocked by safety despite settings, inform the user
         if (candidate.finishReason === 'SAFETY') {
             throw new Error("Generation was blocked by safety filters. Please try a different image.");
         }
         throw new Error(`Generation stopped due to: ${candidate.finishReason}`);
      }

      const parts = candidate.content?.parts;
      if (!parts || parts.length === 0) {
        throw new Error("No content generated.");
      }

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
      }

      // Fallback if text is returned (sometimes happens on error)
      const textPart = parts.find(p => p.text);
      if (textPart) {
        console.warn("Model returned text:", textPart.text);
        throw new Error("The model returned text instead of an image. Please try again.");
      }

      throw new Error("No image data found in response");

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // Preserve the specific error message if it's one we threw
      if (error.message.includes("Generation stopped") || error.message.includes("blocked by safety")) {
        throw error;
      }
      throw new Error(error.message || "Failed to process image");
    }
  }
}

export const geminiService = new GeminiService();