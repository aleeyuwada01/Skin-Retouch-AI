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

  async reEnhanceImage(
    imageBase64: string,
    resolution: '1K' | '2K' | '4K' = '4K'
  ): Promise<string> {
    const reEnhancePrompt = `INTENSIVE RE-ENHANCEMENT: This image needs additional retouching. Apply the following aggressively:
- Remove ALL remaining spots, blemishes, marks, and imperfections - leave NO visible flaws
- Smooth skin further for an ultra-flawless, poreless finish
- Apply stronger Dodge & Burn: brighten highlights on forehead, nose, cheekbones, chin; deepen shadows under cheekbones, jawline, and sides of nose for more sculpted look
- Even out any remaining skin tone inconsistencies
- Enhance facial contours and definition
- Make the skin look absolutely flawless while still natural
Keep the same aspect ratio and dimensions.`;
    
    // Use Natural style with aggressive smoothing instruction
    return this.enhanceImage(imageBase64, EnhanceStyle.Natural, reEnhancePrompt, resolution);
  }

  async enhanceImage(
    imageBase64: string,
    style: EnhanceStyle,
    customPrompt?: string,
    resolution: '1K' | '2K' | '4K' = '4K'
  ): Promise<string> {
    console.log("=== GEMINI SERVICE DEBUG ===");
    console.log("API Key loaded:", process.env.API_KEY ? "Yes (length: " + process.env.API_KEY.length + ")" : "NO - MISSING!");
    console.log("Style:", style);
    console.log("Resolution:", resolution);
    console.log("Image base64 length:", imageBase64?.length);
    
    try {
      // Detect MIME type dynamically from the Data URL
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      
      let promptText = "";

      if (style === EnhanceStyle.Custom && customPrompt) {
        promptText = `Retouch this image based on the following instruction: ${customPrompt}. Ensure you maintain high-quality skin texture and do not alter the background identity. Output the image at the highest possible resolution (4K/Ultra HD quality).`;
      } else {
        const selectedStyle = STYLES.find(s => s.id === style);
        promptText = selectedStyle ? selectedStyle.prompt : STYLES[0].prompt;
        
        if (customPrompt) {
          promptText += ` \nAdditional Instruction: ${customPrompt}`;
        }
      }
      
      // Add eye whitening and aspect ratio preservation to all prompts
      promptText += ` IMPORTANT: Clean and whiten the eye whites (sclera) by removing redness and yellow tints. Brighten the eyes naturally. CRITICAL: Do NOT crop, resize, or change the aspect ratio. The output image MUST have the EXACT same dimensions and aspect ratio as the input. Output at highest quality.`;

      // Explicitly configure safety settings to BLOCK_NONE for all categories
      // This is crucial for skin retouching apps as close-ups can trigger false positives
      const safetySettings: any[] = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ];

      console.log("Calling Gemini API...");
      console.log("MIME type:", mimeType);
      console.log("Prompt:", promptText.substring(0, 100) + "...");
      
      console.log("Using resolution:", resolution);
      
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
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            imageSize: resolution
          }
        }
      });

      console.log("Gemini response received:", response);
      console.log("Candidates:", response.candidates);
      
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

      console.log("Candidate:", candidate);
      console.log("Candidate finishReason:", candidate.finishReason);
      console.log("Candidate content:", candidate.content);
      
      const parts = candidate.content?.parts;
      console.log("Parts:", parts);
      
      if (!parts || parts.length === 0) {
        throw new Error("No content generated.");
      }

      for (const part of parts) {
        console.log("Checking part:", part);
        console.log("Has inlineData:", !!part.inlineData);
        if (part.inlineData) {
          console.log("inlineData.data exists:", !!part.inlineData.data);
          console.log("inlineData.data length:", part.inlineData.data?.length);
        }
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
      console.error("=== GEMINI API ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Full error:", error);
      
      // Check for network errors
      if (error.message?.includes('fetch') || 
          error.message?.includes('network') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('ENOTFOUND') ||
          error.message?.includes('ETIMEDOUT') ||
          error.name === 'TypeError' && error.message?.includes('fetch')) {
        throw new Error("Network error. Please check your internet connection and try again.");
      }
      
      // Check for timeout
      if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
        throw new Error("Request timed out. Please try again.");
      }
      
      // Check for rate limiting
      if (error.message?.includes('429') || error.message?.includes('rate limit') || error.message?.includes('quota')) {
        throw new Error("Too many requests. Please wait a moment and try again.");
      }
      
      // Preserve specific error messages
      if (error.message.includes("Generation stopped") || error.message.includes("blocked by safety")) {
        throw error;
      }
      
      // Check for API errors
      if (error.message?.includes('400') || error.message?.includes('INVALID_ARGUMENT')) {
        throw new Error("Invalid request. Please try a different image.");
      }
      
      if (error.message?.includes('500') || error.message?.includes('503')) {
        throw new Error("Server error. Please try again in a moment.");
      }
      
      throw new Error(error.message || "Failed to process image. Please try again.");
    }
  }
}

export const geminiService = new GeminiService();