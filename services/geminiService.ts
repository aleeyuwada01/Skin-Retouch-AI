import { GoogleGenAI } from "@google/genai";
import { EnhanceStyle } from "../types";
import { STYLES, SYSTEM_INSTRUCTION, SOURCE_ADHERENCE_GUARDRAIL } from "../constants";

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
    const reEnhancePrompt = SOURCE_ADHERENCE_GUARDRAIL + `\n\nINTENSIVE RE-ENHANCEMENT: This image needs additional retouching. Apply the following aggressively:
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

      // ALWAYS start with source adherence guardrail
      promptText = SOURCE_ADHERENCE_GUARDRAIL + "\n\n";

      if (style === EnhanceStyle.Custom && customPrompt) {
        promptText += `Retouch this image based on the following instruction: ${customPrompt}. Ensure you maintain high-quality skin texture and do not alter the background identity. Output the image at the highest possible resolution (4K/Ultra HD quality).`;
      } else {
        const selectedStyle = STYLES.find(s => s.id === style);
        promptText += selectedStyle ? selectedStyle.prompt : STYLES[0].prompt;
        
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

  async replaceBackground(
    portraitBase64: string,
    backgroundBase64: string,
    resolution: '1K' | '2K' | '4K' = '4K'
  ): Promise<string> {
    console.log("=== BACKGROUND REPLACEMENT ===");
    
    try {
      // Detect MIME types
      const portraitMimeMatch = portraitBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const portraitMimeType = portraitMimeMatch ? portraitMimeMatch[1] : 'image/jpeg';
      const cleanPortraitBase64 = portraitBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const bgMimeMatch = backgroundBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const bgMimeType = bgMimeMatch ? bgMimeMatch[1] : 'image/jpeg';
      const cleanBgBase64 = backgroundBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const promptText = `BACKGROUND REPLACEMENT TASK

IMAGE 1 (FIRST): Portrait of a person - THIS CONTROLS THE OUTPUT SIZE
IMAGE 2 (SECOND): Reference background to use

TASK: Cut out the person from IMAGE 1 and place them on the background from IMAGE 2.

=== CRITICAL: OUTPUT DIMENSIONS ===
The output image MUST have the EXACT SAME WIDTH and HEIGHT as IMAGE 1 (the portrait).
DO NOT use the dimensions of IMAGE 2 (the background).
DO NOT change the aspect ratio.
DO NOT crop or resize.
The portrait image dimensions are the MASTER - copy them exactly.

=== CRITICAL: SIGMA 85mm f/1.4 LENS BLUR ===
Apply STRONG GAUSSIAN BLUR to the ENTIRE background - simulate Sigma Art 85mm f/1.4 wide open.
BLUR STRENGTH: Heavy blur - the background should be very soft and dreamy, like shot at f/1.4
The blur must be UNIFORM across 100% of the background - every pixel blurred equally
NO sharp areas in background - everything behind the subject must be soft
This creates professional portrait separation - sharp subject, creamy blurred background

=== CRITICAL: USE EXACT REFERENCE BACKGROUND ===
Use the EXACT background from IMAGE 2 - same colors, same scene, same everything
DO NOT change the background colors or generate a different background
DO NOT modify what the background looks like - just blur it
The background should be recognizable as IMAGE 2, just with blur applied

=== BLENDING ===
Blend the person naturally into the background:
- Match lighting direction and color temperature
- Smooth edges around hair and body - no visible cutout lines
- Add subtle shadows where person meets ground/surface
- The composite should look like one real photograph

=== PRESERVE ===
- Person's exact appearance, size, position from IMAGE 1
- All skin retouching quality
- Sharp focus on the subject

=== FORBIDDEN ===
- Changing output dimensions (MUST match IMAGE 1)
- Sharp/unblurred background areas
- Visible edges or halos around person
- Changing the reference background's appearance
- Using background's aspect ratio instead of portrait's

OUTPUT: Single image with person sharp, background uniformly blurred with Sigma f/1.4 bokeh, dimensions matching IMAGE 1.`;

      const safetySettings: any[] = [
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
                mimeType: portraitMimeType,
                data: cleanPortraitBase64
              }
            },
            {
              inlineData: {
                mimeType: bgMimeType,
                data: cleanBgBase64
              }
            },
            {
              text: promptText
            }
          ]
        },
        config: {
          safetySettings: safetySettings,
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            imageSize: resolution
          }
        }
      });

      const candidate = response.candidates?.[0];
      
      if (!candidate) {
        throw new Error("No candidates returned. The request may have failed.");
      }

      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
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

      throw new Error("No image data found in response");

    } catch (error: any) {
      console.error("=== BACKGROUND REPLACEMENT ERROR ===", error);
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        throw new Error("Too many requests. Please wait a moment and try again.");
      }
      
      throw new Error(error.message || "Failed to replace background. Please try again.");
    }
  }
}

export const geminiService = new GeminiService();