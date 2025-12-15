import { GoogleGenAI } from "@google/genai";
import { EnhanceStyle } from "../types";
import { STYLES, SYSTEM_INSTRUCTION, SOURCE_ADHERENCE_GUARDRAIL, GUARDRAIL_JSON } from "../constants";

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

      // Build guardrails from JSON structure
      const guardrailRules = {
        protocol: GUARDRAIL_JSON.protocol,
        prohibitions: GUARDRAIL_JSON.absolute_prohibitions,
        identity_rule: GUARDRAIL_JSON.identity_rule
      };

      const promptText = `BACKGROUND REPLACEMENT TASK - STRICT SUBJECT PRESERVATION

=== GUARDRAIL PROTOCOL ===
${guardrailRules.protocol}

=== ABSOLUTE PROHIBITIONS ===
${guardrailRules.prohibitions.map(p => `- ${p}`).join('\n')}

=== IDENTITY RULE ===
${guardrailRules.identity_rule}

=== INPUT IMAGES ===
IMAGE 1 (FIRST): Portrait/photo of a person - THIS IS THE MASTER IMAGE
IMAGE 2 (SECOND): Reference background texture/scene

=== TASK ===
Extract ONLY the person/subject from IMAGE 1 and composite them onto the background from IMAGE 2.

=== CRITICAL: SUBJECT PRESERVATION (HIGHEST PRIORITY) ===
You MUST preserve the subject EXACTLY as they appear in IMAGE 1:
- SAME exact body - do NOT add, remove, or modify ANY body parts
- SAME exact clothing - do NOT add, remove, or change ANY clothing/accessories
- SAME exact pose - do NOT change arm position, hand position, head angle, body angle
- SAME exact framing - if the image shows half body, output half body. If full body, output full body.
- SAME exact crop - do NOT extend the image to show more of the person than visible in IMAGE 1
- SAME exact appearance - skin, hair, face, everything IDENTICAL to IMAGE 1

=== CRITICAL: DO NOT HALLUCINATE OR EXTEND ===
- If IMAGE 1 shows a person from waist up, output ONLY waist up - do NOT generate legs
- If IMAGE 1 shows a person from chest up, output ONLY chest up - do NOT generate torso/body
- If arms are cropped in IMAGE 1, keep them cropped - do NOT generate full arms
- NEVER add shadows that imply body parts not visible in IMAGE 1
- NEVER generate clothing, accessories, or body parts not in IMAGE 1
- The subject boundary in output MUST match IMAGE 1 exactly

=== CRITICAL: OUTPUT DIMENSIONS ===
The output MUST have EXACT SAME dimensions as IMAGE 1:
- SAME width in pixels
- SAME height in pixels  
- SAME aspect ratio
- DO NOT use IMAGE 2's dimensions
- DO NOT crop or resize
- DO NOT add letterboxing or pillarboxing

=== BACKGROUND TREATMENT ===
Apply professional portrait blur (Sigma 85mm f/1.4 simulation):
- STRONG Gaussian blur on entire background
- Uniform blur - no sharp areas
- Use EXACT colors/scene from IMAGE 2
- DO NOT change or recolor the background
- Background should be recognizable as IMAGE 2, just blurred

=== EDGE BLENDING ===
- Smooth, natural edges around hair and body
- No visible cutout lines or halos
- Match lighting between subject and background
- Subtle contact shadows where appropriate (only where subject touches surfaces)

=== ABSOLUTE FORBIDDEN ===
- Generating body parts not in IMAGE 1 (legs, arms, torso, etc.)
- Adding clothing or accessories not in IMAGE 1
- Changing the subject's pose or position
- Extending the frame to show more of the person
- Using IMAGE 2's aspect ratio
- Creating a different person
- Adding any elements not present in IMAGE 1

OUTPUT: Single composite image with subject from IMAGE 1 (EXACTLY as shown, no additions) on blurred IMAGE 2 background, matching IMAGE 1 dimensions.`;

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