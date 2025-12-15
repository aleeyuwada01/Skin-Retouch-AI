import { EnhanceStyle, StyleConfig, LogoOverlayState, RetouchPromptJSON, GlobalStyle, RetouchingStep, GuardrailJSON, SystemInstructionJSON, OutputSettings, RetouchPromptMetadata } from './types';

// ============================================
// JSON Schema Validation
// Requirements: 1.3
// ============================================

/**
 * Result of validating a RetouchPromptJSON object.
 */
export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
}

/**
 * Validates that a RetouchPromptJSON object contains all required fields.
 * Required fields: task_type, style_profile, retouching_steps, global_style
 * 
 * Requirements: 1.3
 * 
 * @param obj - The object to validate
 * @returns ValidationResult with valid flag and list of missing fields
 */
export function validateRetouchPromptJSON(obj: unknown): ValidationResult {
  const missingFields: string[] = [];
  
  if (obj === null || typeof obj !== 'object') {
    return {
      valid: false,
      missingFields: ['task_type', 'style_profile', 'retouching_steps', 'global_style']
    };
  }
  
  const candidate = obj as Record<string, unknown>;
  
  // Check task_type
  if (!('task_type' in candidate) || typeof candidate.task_type !== 'string') {
    missingFields.push('task_type');
  }
  
  // Check style_profile
  if (!('style_profile' in candidate) || typeof candidate.style_profile !== 'string') {
    missingFields.push('style_profile');
  }
  
  // Check retouching_steps
  if (!('retouching_steps' in candidate) || !Array.isArray(candidate.retouching_steps)) {
    missingFields.push('retouching_steps');
  }
  
  // Check global_style
  if (!('global_style' in candidate) || typeof candidate.global_style !== 'object' || candidate.global_style === null) {
    missingFields.push('global_style');
  } else {
    // Validate global_style has required fields
    const globalStyle = candidate.global_style as Record<string, unknown>;
    if (typeof globalStyle.aesthetic_goal !== 'string') {
      missingFields.push('global_style.aesthetic_goal');
    }
    if (typeof globalStyle.prohibitions !== 'string') {
      missingFields.push('global_style.prohibitions');
    }
    if (typeof globalStyle.final_check !== 'string') {
      missingFields.push('global_style.final_check');
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

// ============================================
// Merge Utility Function
// Requirements: 8.1, 8.2, 8.4
// ============================================

/**
 * Merges a base RetouchPromptJSON with style-specific overrides.
 * 
 * Merge behavior:
 * - retouching_steps: Base steps are preserved, style steps are appended.
 *   If a style step has the same step_name as a base step, the style step overrides it.
 * - global_style: Deep merged with style values taking precedence.
 * - output_settings: Style values override base values.
 * - Other fields: Style values override base values.
 * 
 * Requirements: 8.1, 8.2, 8.4
 * 
 * @param base - The base RetouchPromptJSON (typically BASE_RETOUCH_JSON)
 * @param style - The style-specific RetouchPromptJSON with overrides
 * @returns A merged RetouchPromptJSON with all base steps preserved and style overrides applied
 */
export function mergeRetouchPrompts(
  base: Partial<RetouchPromptJSON>,
  style: Partial<RetouchPromptJSON>
): RetouchPromptJSON {
  // Merge retouching_steps: preserve all base steps, override by step_name if style has same step
  const baseSteps = base.retouching_steps || [];
  const styleSteps = style.retouching_steps || [];
  
  // Create a map of style steps by step_name for quick lookup
  const styleStepMap = new Map<string, RetouchingStep>();
  for (const step of styleSteps) {
    styleStepMap.set(step.step_name, step);
  }
  
  // Start with base steps, replacing any that have matching step_name in style
  const mergedSteps: RetouchingStep[] = baseSteps.map(baseStep => {
    const styleOverride = styleStepMap.get(baseStep.step_name);
    if (styleOverride) {
      // Style step overrides base step with same name
      styleStepMap.delete(baseStep.step_name); // Remove from map so we don't add it again
      return styleOverride;
    }
    return baseStep;
  });
  
  // Append any remaining style steps that don't override base steps
  for (const step of styleSteps) {
    if (styleStepMap.has(step.step_name)) {
      mergedSteps.push(step);
    }
  }
  
  // Deep merge global_style with style values taking precedence
  const mergedGlobalStyle: GlobalStyle = {
    aesthetic_goal: style.global_style?.aesthetic_goal || base.global_style?.aesthetic_goal || '',
    prohibitions: style.global_style?.prohibitions || base.global_style?.prohibitions || '',
    final_check: style.global_style?.final_check || base.global_style?.final_check || ''
  };
  
  // Merge output_settings with style values taking precedence
  const mergedOutputSettings: OutputSettings = {
    aspect_ratio: style.output_settings?.aspect_ratio || base.output_settings?.aspect_ratio || 'maintain_original',
    resolution: style.output_settings?.resolution || base.output_settings?.resolution || 'maintain_original',
    format: style.output_settings?.format || base.output_settings?.format || 'jpeg',
    comparison: style.output_settings?.comparison ?? base.output_settings?.comparison ?? false
  };
  
  // Merge metadata
  const mergedMetadata: RetouchPromptMetadata = {
    original_label: style.metadata?.original_label || base.metadata?.original_label || '',
    description: style.metadata?.description || base.metadata?.description || ''
  };
  
  return {
    task_type: style.task_type || base.task_type || 'image_retouching',
    input_image_id: style.input_image_id || base.input_image_id || 'user_input_image',
    style_profile: style.style_profile || base.style_profile || '',
    output_settings: mergedOutputSettings,
    retouching_steps: mergedSteps,
    global_style: mergedGlobalStyle,
    metadata: mergedMetadata
  };
}

// ============================================
// Format Utility Function
// Requirements: 1.4, 6.1
// ============================================

/**
 * Converts a RetouchPromptJSON object to a formatted JSON string for the AI model.
 * 
 * This function produces a properly formatted JSON string that can be sent to
 * image generation models. The output is valid JSON that can be parsed back
 * to an equivalent object.
 * 
 * Requirements: 1.4, 6.1
 * 
 * @param prompt - The RetouchPromptJSON object to format
 * @returns A formatted JSON string suitable for AI model consumption
 */
export function formatPromptForModel(prompt: RetouchPromptJSON): string {
  return JSON.stringify(prompt, null, 2);
}

// Tour Configuration - Controls application tour display behavior
export const TOUR_CONFIG = {
  MAX_DISPLAY_COUNT: 3,
  STORAGE_KEY: 'skinRetoucher_tourShownCount',
  DISABLED_KEY: 'skinRetoucher_tutorialDisabled'
};

/**
 * Gets the current tour display count from local storage.
 * @returns The number of times the tour has been displayed
 */
export const getTourDisplayCount = (): number => {
  const count = localStorage.getItem(TOUR_CONFIG.STORAGE_KEY);
  return count ? parseInt(count, 10) : 0;
};

/**
 * Increments the tour display count by 1 and stores it.
 * @returns The new tour display count after incrementing
 */
export const incrementTourCount = (): number => {
  const newCount = getTourDisplayCount() + 1;
  localStorage.setItem(TOUR_CONFIG.STORAGE_KEY, String(newCount));
  return newCount;
};

/**
 * Determines if the tour should be shown based on display count and disabled state.
 * @returns true if tour should be shown, false otherwise
 */
export const shouldShowTour = (): boolean => {
  const disabled = localStorage.getItem(TOUR_CONFIG.DISABLED_KEY) === 'true';
  if (disabled) return false;
  return getTourDisplayCount() < TOUR_CONFIG.MAX_DISPLAY_COUNT;
};

/**
 * Resets the tour display count to zero and removes the disabled flag.
 */
export const resetTourCount = (): void => {
  localStorage.setItem(TOUR_CONFIG.STORAGE_KEY, '0');
  localStorage.removeItem(TOUR_CONFIG.DISABLED_KEY);
};

/**
 * Permanently disables the tour from showing automatically.
 */
export const disableTourPermanently = (): void => {
  localStorage.setItem(TOUR_CONFIG.DISABLED_KEY, 'true');
};

// Logo Overlay Guardrail - Preserves logo state during background replacement
export const LOGO_OVERLAY_SELECTOR = '[data-logo-overlay]';

/**
 * Captures the current state of the logo overlay element.
 * Used before background replacement to preserve logo position, size, visibility, and z-index.
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @returns LogoOverlayState if logo element exists, null otherwise
 */
export const captureLogoState = (): LogoOverlayState | null => {
  const logoElement = document.querySelector(LOGO_OVERLAY_SELECTOR) as HTMLElement | null;
  if (!logoElement) return null;
  
  const rect = logoElement.getBoundingClientRect();
  const style = window.getComputedStyle(logoElement);
  
  return {
    position: { x: rect.left, y: rect.top },
    size: { width: rect.width, height: rect.height },
    visible: style.visibility !== 'hidden' && style.display !== 'none',
    zIndex: parseInt(style.zIndex, 10) || 100
  };
};

/**
 * Restores the logo overlay element to a previously captured state.
 * Used after background replacement to ensure logo remains visible and properly positioned.
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * 
 * @param state The LogoOverlayState to restore
 */
export const restoreLogoState = (state: LogoOverlayState | null): void => {
  if (!state) return;
  
  const logoElement = document.querySelector(LOGO_OVERLAY_SELECTOR) as HTMLElement | null;
  if (!logoElement) return;
  
  // Restore visibility
  logoElement.style.visibility = state.visible ? 'visible' : 'hidden';
  
  // Ensure logo is composited on top (Requirements: 1.4)
  logoElement.style.zIndex = String(Math.max(state.zIndex, 100));
};

// Source Adherence Guardrail - Ensures AI retouches rather than generates new images
export const SOURCE_ADHERENCE_GUARDRAIL = `
**CRITICAL: SOURCE IMAGE ADHERENCE PROTOCOL**

This is a RETOUCH operation, NOT image generation. You MUST work with the PROVIDED SOURCE IMAGE.

MANDATORY REQUIREMENTS:
1. The output MUST be a retouched version of the INPUT image - NOT a new creation
2. PRESERVE exactly: subject identity, pose, position, facial features, expression, body shape
3. PRESERVE exactly: background, scene composition, framing, all non-skin elements
4. You are a NON-GENERATIVE photo editor - enhance what exists, create nothing new

ABSOLUTE PROHIBITIONS:
- DO NOT generate a new person or replace the subject
- DO NOT create a new scene or change the background
- DO NOT alter the subject's identity, face shape, or distinguishing features
- DO NOT change pose, position, or body proportions
- DO NOT imagine or invent any elements not present in the source

ALLOWED MODIFICATIONS (visual characteristics only):
- Skin smoothing, blemish removal, tone evening
- Lighting adjustments, color grading, contrast
- Texture enhancement, dodge & burn
- Eye whitening, teeth whitening (if visible)

The person in your output MUST be recognizably the SAME person from the input image.
`;

// ============================================
// GUARDRAIL_JSON - Source Adherence Guardrail in JSON format
// Requirements: 3.1, 3.2
// ============================================

/**
 * JSON structure for source adherence guardrails.
 * Contains safety constraints to prevent AI from generating new images.
 * Requirements: 3.1, 3.2, 3.3
 */
export const GUARDRAIL_JSON: GuardrailJSON = {
  protocol: 'SOURCE IMAGE ADHERENCE PROTOCOL - This is a RETOUCH operation, NOT image generation. You MUST work with the PROVIDED SOURCE IMAGE.',
  mandatory_requirements: [
    'The output MUST be a retouched version of the INPUT image - NOT a new creation',
    'PRESERVE exactly: subject identity, pose, position, facial features, expression, body shape',
    'PRESERVE exactly: background, scene composition, framing, all non-skin elements',
    'You are a NON-GENERATIVE photo editor - enhance what exists, create nothing new'
  ],
  absolute_prohibitions: [
    'DO NOT generate a new person or replace the subject',
    'DO NOT create a new scene or change the background',
    'DO NOT alter the subject\'s identity, face shape, or distinguishing features',
    'DO NOT change pose, position, or body proportions',
    'DO NOT imagine or invent any elements not present in the source'
  ],
  allowed_modifications: [
    'Skin smoothing, blemish removal, tone evening',
    'Lighting adjustments, color grading, contrast',
    'Texture enhancement, dodge & burn',
    'Eye whitening, teeth whitening (if visible)'
  ],
  identity_rule: 'The person in your output MUST be recognizably the SAME person from the input image.'
};

// ============================================
// SYSTEM_INSTRUCTION_JSON - Global AI Behavior Rules
// Requirements: 5.1, 5.2
// ============================================

/**
 * JSON structure for system-level AI instructions.
 * Defines global behavior rules and restrictions for the AI model.
 * Requirements: 5.1, 5.2, 5.3
 */
export const SYSTEM_INSTRUCTION_JSON: SystemInstructionJSON = {
  role: 'You are a PHOTO RETOUCHER, NOT an IMAGE GENERATOR. Your ONLY task is to RETOUCH the provided source image. You must NEVER generate a new image or replace the subject.',
  absolute_rule: 'The output must show the EXACT SAME PERSON from the input, with the EXACT SAME pose, position, and background. Only apply visual enhancements.',
  source_adherence: [
    'You MUST work with the PROVIDED SOURCE IMAGE only',
    'PRESERVE exactly: subject identity, facial features, pose, position, expression, body shape',
    'PRESERVE exactly: background, scene composition, framing',
    'DO NOT generate new subjects, scenes, or elements not in the source',
    'DO NOT replace or reimagine any part of the image'
  ],
  goal: 'Produce natural, premium retouching for fashion, editorial, and portrait photography. Enhance appearance without changing identity or creating artificial effects.',
  critical_rules: [
    'Preserve natural skin texture, pores, fine lines, veins, and details',
    'Do NOT apply global blur or plastic smoothing',
    'Do NOT alter facial structure, body shape, or proportions',
    'Do NOT generate artificial texture',
    'All adjustments must be subtle and realistic'
  ],
  absolute_restrictions: [
    'NEVER crop or resize - maintain EXACT original dimensions',
    'NEVER change aspect ratio',
    'NEVER add teeth or open mouths',
    'NEVER modify facial expressions, lips, or mouth shape',
    'NEVER add or remove body parts or features',
    'NEVER create side-by-side comparisons',
    'OUTPUT ONLY ONE SINGLE RETOUCHED IMAGE'
  ],
  retouching_process: [
    {
      step_name: 'Segmentation',
      target_area: 'face, neck, hands, arms, body skin',
      operation: 'detect_and_mask',
      details: 'Detect face, neck, hands, arms, body skin. Exclude hair, nails, clothing, background.'
    },
    {
      step_name: 'Skin-Evening',
      target_area: 'all_skin_regions',
      operation: 'tone_evening',
      intensity: 0.30,
      details: 'Even tone per region (Face 0.30, Neck 0.25, Hands 0.20, Body 0.15). Preserve shadows/highlights.'
    },
    {
      step_name: 'Texture',
      target_area: 'all_skin_regions',
      operation: 'preserve_texture',
      intensity: 0.80,
      details: 'Preserve pores and texture. NO blur. Face ≥0.80, Body ≥0.90 preservation.'
    },
    {
      step_name: 'Dodge-And-Burn',
      target_area: 'face, neck, hands, body',
      operation: 'local_brightness_adjustment',
      intensity: 0.25,
      details: 'Subtle local corrections for dark spots, patchy lighting. Low intensity only.'
    },
    {
      step_name: 'Blemishes',
      target_area: 'all_skin_regions',
      operation: 'blemish_removal',
      details: 'Remove pimples, acne, dry patches. PRESERVE moles, scars, veins, wrinkles.'
    },
    {
      step_name: 'Harmony',
      target_area: 'face, neck, hands, body',
      operation: 'tone_balancing',
      intensity: 0.20,
      details: 'Balance skin tone across face↔neck↔hands↔body naturally.'
    },
    {
      step_name: 'Eyes',
      target_area: 'eye_sclera',
      operation: 'whiten',
      intensity: 0.70,
      details: 'Make sclera BRIGHT WHITE - remove all redness, yellow, blood vessels. Keep iris natural.'
    },
    {
      step_name: 'Teeth',
      target_area: 'teeth',
      operation: 'conditional_whiten',
      intensity: 0.60,
      details: 'ONLY if already visible - whiten existing teeth. If NOT visible, DO NOTHING to mouth.'
    }
  ],
  final_check: [
    'Skin textured at 100% zoom',
    'No halos or artifacts',
    'Identity preserved',
    'Natural premium result',
    'Single image output only'
  ]
};

// Thumbnails for different styles
const THUMB_NATURAL = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_SCULPTED = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_DARKSKIN = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=100&h=100";

// ============================================
// BASE_RETOUCH_JSON - Professional Retouch Academy Standards
// Requirements: 4.1
// ============================================

/**
 * Base retouching JSON structure containing all 9 foundational retouching steps.
 * Applied to ALL styles as the foundation for retouching operations.
 * Requirements: 4.1, 4.2, 4.3
 */
export const BASE_RETOUCH_JSON: Partial<RetouchPromptJSON> = {
  task_type: 'image_retouching',
  output_settings: {
    aspect_ratio: 'maintain_original',
    resolution: 'maintain_original',
    format: 'jpeg',
    comparison: false
  },
  retouching_steps: [
    {
      step_name: 'Precise-Segmentation',
      target_area: 'face_skin, neck, ears, hands, arms, shoulders, legs, eye_sclera, teeth',
      operation: 'detect_and_mask',
      details: 'Detect and mask skin areas. EXCLUDE: hair, nails, clothing, background, lips shape, mouth shape'
    },
    {
      step_name: 'Skin-Tone-Evening',
      target_area: 'all_skin_regions',
      operation: 'tone_evening',
      intensity: 0.30,
      details: 'Even skin tone without flattening light or depth. Per-region strength: Face (0.25-0.35), Neck (0.20-0.30), Hands (0.15-0.25), Body (0.10-0.20). Reduce: Redness, blotchiness, uneven pigmentation. Preserve: Natural shadows, highlights, light direction.'
    },
    {
      step_name: 'Texture-Preservation',
      target_area: 'all_skin_regions',
      operation: 'preserve_texture',
      intensity: 0.85,
      details: 'Preserve original skin texture and pores. NO blur, NO waxy finish, NO artificial grain. Texture preservation: Face ≥0.80, Hands & Body ≥0.90.'
    },
    {
      step_name: 'Dodge-And-Burn',
      target_area: 'face, neck, hands, body',
      operation: 'local_brightness_adjustment',
      intensity: 0.25,
      details: 'Smooth uneven brightness using subtle local adjustments. Correct: Dark spots, harsh highlights, patchy lighting, eye bag shadows, knuckle darkness. Use low-intensity only. Do not reshape or flatten skin.'
    },
    {
      step_name: 'Selective-Blemish-Removal',
      target_area: 'all_skin_regions',
      operation: 'blemish_removal',
      details: 'REMOVE: Pimples, acne, dry patches, small scratches. PRESERVE: Moles, scars, veins, wrinkles, stretch marks.'
    },
    {
      step_name: 'Cross-Region-Harmony',
      target_area: 'face, neck, hands, body',
      operation: 'tone_balancing',
      intensity: 0.20,
      details: 'Balance skin tone between Face↔Neck, Face↔Hands, Face↔Body. Do not make all areas identical—only naturally consistent.'
    },
    {
      step_name: 'Eye-Whitening',
      target_area: 'eye_sclera',
      operation: 'whiten',
      intensity: 0.70,
      details: 'Make sclera (eye whites) BRIGHT WHITE - remove all redness, yellow, blood vessels. Keep iris and pupils natural.'
    },
    {
      step_name: 'Teeth-Whitening',
      target_area: 'teeth',
      operation: 'conditional_whiten',
      intensity: 0.60,
      details: 'If teeth are showing: make them WHITE, remove yellow/stains. If teeth NOT visible: DO NOTHING to mouth - no adding teeth, no opening mouth.'
    },
    {
      step_name: 'Final-Check',
      target_area: 'entire_image',
      operation: 'quality_verification',
      details: 'Verify: Skin textured at 100% zoom, No halos around eyes or mouth, No color mismatches between face and body, Identity fully preserved, Natural and premium result.'
    }
  ],
  global_style: {
    aesthetic_goal: 'Natural, premium retouching suitable for fashion, editorial, and portrait photography. Enhance appearance without changing identity or creating artificial effects.',
    prohibitions: 'NO global blur, NO plastic smoothing, NO altering facial structure, body shape, or proportions, NO artificial texture, NO cropping/resizing, NO adding teeth or modifying mouth/expressions.',
    final_check: 'Skin textured at 100% zoom, no halos, no color mismatches, identity preserved, natural and premium result.'
  }
};

// ============================================
// Style-Specific JSON Prompts
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
// ============================================

/**
 * Sculpted Glow style JSON - Cinematic glamour with flawless skin and defined features.
 * Requirements: 2.1
 */
export const SCULPTED_GLOW_JSON: RetouchPromptJSON = {
  task_type: 'image_retouching',
  input_image_id: 'user_input_image',
  style_profile: 'Sculpted Glow (Cinematic Glamour)',
  output_settings: {
    aspect_ratio: 'maintain_original',
    resolution: 'maintain_original',
    format: 'jpeg',
    comparison: false
  },
  retouching_steps: [
    {
      step_name: 'Skin-Perfection',
      target_area: 'face, neck, body (all visible skin)',
      operation: 'aggressive_smooth',
      intensity: 0.75,
      details: 'Remove ALL skin imperfections, spots, blemishes, and marks completely for flawless skin. Apply aggressive smoothing for maximum skin uniformity.'
    },
    {
      step_name: 'Heavy-Dodge-And-Burn',
      target_area: 'face, neck',
      operation: 'sculpt_features',
      intensity: 0.80,
      details: 'Use HEAVY Dodge & Burn to dramatically sculpt and define facial features. Strong highlights on forehead, nose bridge, cupid\'s bow, and cheekbone tops. Deep shadows under cheekbones, along jawline, sides of nose, and temples. Create chiseled, defined bone structure.'
    },
    {
      step_name: 'Eye-Enhancement',
      target_area: 'eye_sclera',
      operation: 'whiten',
      intensity: 0.75,
      details: 'ONLY remove redness and yellow tints from the sclera (white part of eyes). DO NOT add any special effects, glow, sparkle, catchlights, or artifacts to the eyes. DO NOT change the iris color, pupil size, or eye shape. Keep the eyes looking completely natural - just cleaner and whiter sclera.'
    }
  ],
  global_style: {
    aesthetic_goal: 'Smooth, flawless, and sculpted like high-end cinematic glamour photography. Chiseled bone structure with dramatic highlights and shadows.',
    prohibitions: 'NO eye effects, glow, sparkle, or catchlights. NO changing iris color, pupil size, or eye shape. NO altering facial structure, body shape, or proportions.',
    final_check: 'Verify: Flawless skin, defined bone structure, natural eyes with clean white sclera, identity preserved.'
  },
  metadata: {
    original_label: 'Sculpted Glow',
    description: 'Cinematic glamour. Flawless skin with defined features.'
  }
};

/**
 * Dark Skin Glow style JSON - Optimized for melanin-rich skin tones.
 * Requirements: 2.2
 */
export const DARK_SKIN_GLOW_JSON: RetouchPromptJSON = {
  task_type: 'image_retouching',
  input_image_id: 'user_input_image',
  style_profile: 'Dark Skin Glow (Melanin-Rich Optimization)',
  output_settings: {
    aspect_ratio: 'maintain_original',
    resolution: 'maintain_original',
    format: 'jpeg',
    comparison: false
  },
  retouching_steps: [
    {
      step_name: 'Melanin-Preservation',
      target_area: 'all_skin_regions',
      operation: 'preserve_enhance',
      intensity: 0.90,
      details: 'Preserve and enhance the natural richness and depth of dark skin tones. DO NOT lighten or wash out the skin. Maintain melanin richness throughout.'
    },
    {
      step_name: 'Hyperpigmentation-Correction',
      target_area: 'face, neck, body',
      operation: 'spot_correction',
      intensity: 0.60,
      details: 'Remove hyperpigmentation, dark spots, and uneven patches while maintaining natural skin color. Even out skin tone without reducing melanin richness.'
    },
    {
      step_name: 'Undertone-Preservation',
      target_area: 'all_skin_regions',
      operation: 'color_preservation',
      intensity: 0.95,
      details: 'Preserve the beautiful undertones (golden, red, blue) present in melanin-rich skin. Remove any ashiness or grayish tones - skin should look vibrant and healthy.'
    },
    {
      step_name: 'Radiant-Glow',
      target_area: 'face, neck, body',
      operation: 'luminosity_enhancement',
      intensity: 0.65,
      details: 'Add a healthy, radiant glow that complements dark skin beautifully. Enhance the natural luminosity of dark skin.'
    },
    {
      step_name: 'Dark-Skin-Dodge-And-Burn',
      target_area: 'face, neck',
      operation: 'sculpt_features',
      intensity: 0.55,
      details: 'Apply Dodge & Burn specifically calibrated for dark skin: subtle highlights on forehead, nose bridge, cheekbones, and chin. Gentle shadows under cheekbones and jawline that enhance without creating ashy appearance.'
    },
    {
      step_name: 'Eye-Enhancement',
      target_area: 'eye_sclera',
      operation: 'whiten',
      intensity: 0.70,
      details: 'Clean and brighten eyes while keeping them natural. Remove redness and yellow tints from sclera.'
    }
  ],
  global_style: {
    aesthetic_goal: 'Celebrate and enhance dark skin\'s natural beauty with a flawless, glowing finish. Vibrant, healthy, radiant melanin-rich skin.',
    prohibitions: 'DO NOT lighten skin. DO NOT wash out melanin richness. DO NOT create ashy or grayish tones. NO altering facial structure or body shape.',
    final_check: 'Verify: Melanin richness preserved, undertones intact, no ashiness, radiant glow, identity preserved.'
  },
  metadata: {
    original_label: 'Dark Skin Glow',
    description: 'Optimized for melanin-rich skin. Even tone, radiant glow.'
  }
};

/**
 * Gilded Editorial style JSON - High-end beauty with maximum luminance and deep contouring.
 * Requirements: 2.3
 */
export const GILDED_EDITORIAL_JSON: RetouchPromptJSON = {
  task_type: 'image_retouching',
  input_image_id: 'user_input_image',
  style_profile: 'Gilded Editorial (High-End Beauty)',
  output_settings: {
    aspect_ratio: 'maintain_original',
    resolution: 'maintain_original',
    format: 'jpeg',
    comparison: false
  },
  retouching_steps: [
    {
      step_name: 'Flawless-Skin-Perfection',
      target_area: 'face, neck, body (all visible skin)',
      operation: 'aggressive_smooth_texture',
      intensity: 0.85,
      details: 'Achieve a completely flawless, porcelain-smooth skin finish. Apply aggressive smoothing for MAXIMUM skin uniformity and seamless color transitions. Remove ALL skin imperfections, spots, blemishes, and texture issues completely. CRITICAL: Preserve and enhance the natural richness of melanin-rich skin tone – DO NOT lighten, wash out, or reduce saturation.'
    },
    {
      step_name: 'High-Intensity-Luminosity',
      target_area: 'center_forehead, nose_bridge, cheekbone_tops, cupids_bow, chin_center',
      operation: 'intense_dodge_highlight',
      intensity: 0.85,
      value: 'wet-look highlights',
      details: 'Create a HIGH-INTENSITY luminous glow effect. Apply strong, precise Dodge (lightening) to create dramatic, wet-look highlights. Nose bridge (high focus), tops of cheekbones (intense focus), cupid\'s bow and center of chin. Highlights must look distinct, sharp, and highly reflective, creating a \'gilded\' appearance.'
    },
    {
      step_name: 'Heavy-Contouring',
      target_area: 'under_cheekbones, jawline, nose_sides, temples',
      operation: 'heavy_burn',
      intensity: 0.80,
      details: 'Use HEAVY Burn (darkening) to dramatically sculpt and define the bone structure. Deepen shadows significantly under the cheekbones, along the jawline, and at the sides of the nose and temples. Create a deeply chiseled and defined facial structure for a high-fashion, commercial look.'
    },
    {
      step_name: 'Intense-Eye-Enhancement',
      target_area: 'eye_sclera, eye_area',
      operation: 'intense_whiten',
      intensity: 0.85,
      details: 'CRITICAL Eye Whitening: Make the sclera (eye whites) PURE, INTENSE WHITE—remove ALL redness, yellow, and any visible blood vessels. Brighten the eye area intensely to make the eyes stand out dramatically. DO NOT add special effects. Keep the iris and pupil natural.'
    },
    {
      step_name: 'Texture-Control',
      target_area: 'face',
      operation: 'preserve_texture',
      intensity: 0.65,
      details: 'Due to the aggressive smoothing required for this aesthetic, texture preservation is lowered slightly. Set texture preservation to Face ≥0.65 to maintain minimal pores/detail while achieving maximum smoothness.'
    }
  ],
  global_style: {
    aesthetic_goal: 'Hyper-retouched, high-contrast, luminous, and dramatically contoured. High-end beauty for commercial luxury photography.',
    prohibitions: 'DO NOT lighten dark skin tones. DO NOT wash out or reduce saturation. NO altering facial structure, body shape, or proportions. NO eye special effects.',
    final_check: 'Verify: Flawless porcelain-smooth skin, intense wet-look highlights, deep chiseled contours, brilliant white eyes, identity preserved.'
  },
  metadata: {
    original_label: 'Gilded Editorial',
    description: 'High-end beauty. Maximum luminance, deep contouring, flawless skin, and dramatic highlights.'
  }
};

/**
 * Ultra Glam style JSON - Maximum intensity with extreme smoothing and dramatic effects.
 * Requirements: 2.4
 */
export const ULTRA_GLAM_JSON: RetouchPromptJSON = {
  task_type: 'image_retouching',
  input_image_id: 'user_input_image',
  style_profile: 'Ultra Glam (Maximum Intensity)',
  output_settings: {
    aspect_ratio: 'maintain_original',
    resolution: 'maintain_original',
    format: 'jpeg',
    comparison: false
  },
  retouching_steps: [
    {
      step_name: 'Extreme-Skin-Perfection',
      target_area: 'face, neck, body (all visible skin)',
      operation: 'aggressive_smooth_texture',
      intensity: 0.95,
      details: 'HEAVY frequency separation smoothing. Remove 100% of ALL visible pores - skin must look like smooth porcelain/glass. Remove ALL spots, blemishes, marks, acne, texture, bumps - ZERO imperfections. Create completely UNIFORM, FLAWLESS skin tone. The skin should look AIRBRUSHED and IMPOSSIBLY SMOOTH - like a wax figure or CGI. CRITICAL: Preserve natural skin COLOR/tone - do NOT lighten or wash out dark skin.'
    },
    {
      step_name: 'Extreme-Wet-Look-Highlights',
      target_area: 'center_forehead, nose_bridge, cheekbone_tops, cupids_bow, chin_center, collar_bones',
      operation: 'intense_dodge_highlight',
      intensity: 0.95,
      value: 'EXTREME bright highlights',
      details: 'Apply INTENSE dodge (lightening) to create dramatic WET-LOOK highlights. Center of forehead: STRONG bright highlight. Nose bridge: MAXIMUM intensity highlight - almost white/reflective. Cheekbone tops: EXTREME bright highlights - like light reflecting off glass. Cupid\'s bow: Sharp bright highlight. Chin center: Strong highlight. Collar bones (if visible): Dramatic highlights. Highlights should look SHARP, INTENSE, and HIGHLY REFLECTIVE - like liquid gold on skin.'
    },
    {
      step_name: 'Extreme-Contouring',
      target_area: 'under_cheekbones, jawline, nose_sides, temples, under_chin, hairline_edges',
      operation: 'maximum_burn',
      intensity: 0.90,
      details: 'Apply MAXIMUM burn (darkening) for dramatic sculpting. Under cheekbones: DEEP, dramatic shadows - create hollow, chiseled look. Jawline: Strong shadow definition - sharp, defined jaw. Sides of nose: Deep shadows for narrow, sculpted nose. Temples: Darkened for face shape definition. Under chin/neck: Strong shadow for definition. Hairline edges: Subtle darkening. Face should look EXTREMELY SCULPTED and CHISELED - high-fashion editorial intensity.'
    },
    {
      step_name: 'Extreme-Eye-Enhancement',
      target_area: 'eye_sclera ONLY',
      operation: 'sclera_whiten_only',
      intensity: 0.95,
      details: 'ONLY whiten the sclera (eye whites) - make them PURE BRILLIANT WHITE by removing 100% of redness, yellow, blood vessels. CRITICAL EYE PRESERVATION: DO NOT touch the iris - preserve EXACT original iris color (brown, blue, green, hazel, etc.). DO NOT touch the pupil - preserve EXACT original pupil size and shape. DO NOT add any effects to eyes - no sparkles, catchlights, glow, reflections, or shine. DO NOT change eye shape or size. The iris and pupil must look IDENTICAL to the original - only the white part (sclera) should be whiter.'
    },
    {
      step_name: 'Extreme-Teeth-Whitening',
      target_area: 'teeth',
      operation: 'conditional_maximum_whiten',
      intensity: 0.95,
      details: 'If teeth are showing: make them BRILLIANT WHITE - perfect Hollywood smile. Remove ALL yellow, stains, discoloration completely. If teeth NOT visible: DO NOT modify mouth at all.'
    }
  ],
  global_style: {
    aesthetic_goal: 'HYPER-RETOUCHED, HIGH-CONTRAST, ULTRA-GLAMOROUS, high-fashion editorial. Impossibly smooth skin, intense reflections, deep contours, brilliant white sclera. Retouching must be OBVIOUS and DRAMATIC.',
    prohibitions: 'NEVER change pose, facial/body structure, proportions, background. EYES CRITICAL: NEVER change iris color - preserve EXACT original eye color. NEVER change pupil size or shape. NEVER add eye effects - no sparkles, catchlights, glow, reflections, shine. ONLY whiten the sclera (white part). NEVER crop, resize, or change dimensions.',
    final_check: 'Verify: Impossibly smooth skin (like airbrushed/CGI), Intense reflective highlights, Deep dramatic contours, Brilliant white sclera WITH ORIGINAL IRIS COLOR PRESERVED, HYPER-RETOUCHED appearance, identity preserved.'
  },
  metadata: {
    original_label: 'Ultra Glam',
    description: 'Maximum intensity. Extreme luminance, ultra-deep contouring, glass-like skin perfection.'
  }
};

/**
 * Soft Beauty style JSON - Fashion look with moderate smoothing and subtle glow.
 * Requirements: 2.5
 */
export const SOFT_BEAUTY_JSON: RetouchPromptJSON = {
  task_type: 'image_retouching',
  input_image_id: 'user_input_image',
  style_profile: 'Soft Beauty (Fashion Look)',
  output_settings: {
    aspect_ratio: 'maintain_original',
    resolution: 'maintain_original',
    format: 'jpeg',
    comparison: false
  },
  retouching_steps: [
    {
      step_name: 'Moderate-Smoothing',
      target_area: 'face, neck, body (all visible skin)',
      operation: 'moderate_smooth',
      intensity: 0.60,
      details: 'Apply moderate smoothing for seamless color transitions. Remove all blemishes and imperfections completely. Reduce texture prominence slightly for a polished, magazine-quality finish.'
    },
    {
      step_name: 'Subtle-Luminous-Glow',
      target_area: 'face, neck',
      operation: 'luminosity_enhancement',
      intensity: 0.50,
      details: 'Add a subtle luminous glow effect. Create soft, natural-looking radiance without harsh highlights.'
    },
    {
      step_name: 'Soft-Dodge-And-Burn',
      target_area: 'face, neck',
      operation: 'soft_sculpt',
      intensity: 0.50,
      details: 'Apply moderate Dodge & Burn to sculpt facial features softly. Brighten T-zone, under-eye area, and chin. Add gentle shadows under cheekbones and along jawline. Keep the sculpting subtle and natural.'
    },
    {
      step_name: 'Eye-Enhancement',
      target_area: 'eye_sclera',
      operation: 'whiten',
      intensity: 0.65,
      details: 'Brighten eye whites naturally. Remove redness and yellow tints while maintaining a natural appearance.'
    }
  ],
  global_style: {
    aesthetic_goal: 'Soft, flawless, and radiant. Polished, magazine-quality finish with natural-looking beauty enhancement.',
    prohibitions: 'NO harsh highlights or deep shadows. NO plastic or artificial appearance. NO altering facial structure, body shape, or proportions.',
    final_check: 'Verify: Smooth polished skin, subtle glow, soft natural sculpting, clean bright eyes, identity preserved.'
  },
  metadata: {
    original_label: 'Soft Beauty',
    description: 'Fashion look. Smoother transitions, slight glow, flawless skin.'
  }
};

// Professional Retouch Academy Standards - Applied to ALL styles
const BASE_RETOUCH = `
You are a professional high-end beauty retoucher trained to Retouch Academy standards.

GOAL: Produce natural, premium retouching suitable for fashion, editorial, and portrait photography. Enhance appearance without changing identity or creating artificial effects.

OUTPUT RULES:
- Return ONLY ONE IMAGE - the retouched version only
- NO side-by-side comparisons or before/after
- Maintain EXACT original dimensions and aspect ratio

CRITICAL RULES:
- Preserve natural skin texture, pores, fine lines, veins, and details
- Do NOT apply global blur or plastic smoothing
- Do NOT alter facial structure, body shape, or proportions
- Do NOT generate artificial texture
- Do NOT crop, resize, or change composition
- Do NOT add teeth or modify mouth/expressions
- All adjustments must be subtle and realistic

STEP 1 - PRECISE SEGMENTATION:
Detect and mask: Face skin, Neck, Ears, Hands, Arms, Shoulders, Legs, Eye sclera, Teeth (if visible)
EXCLUDE from edits: Hair, nails, clothing, background, lips shape, mouth shape

STEP 2 - SKIN TONE EVENING:
Even skin tone without flattening light or depth.
Per-region strength: Face (0.25-0.35), Neck (0.20-0.30), Hands (0.15-0.25), Body (0.10-0.20)
Reduce: Redness, blotchiness, uneven pigmentation
Preserve: Natural shadows, highlights, light direction

STEP 3 - TEXTURE PRESERVATION:
Preserve original skin texture and pores. NO blur, NO waxy finish, NO artificial grain.
Texture preservation: Face ≥0.80, Hands & Body ≥0.90

STEP 4 - DODGE & BURN:
Smooth uneven brightness using subtle local adjustments.
Correct: Dark spots, harsh highlights, patchy lighting, eye bag shadows, knuckle darkness
Use low-intensity only. Do not reshape or flatten skin.

STEP 5 - SELECTIVE BLEMISH REMOVAL:
REMOVE: Pimples, acne, dry patches, small scratches
PRESERVE: Moles, scars, veins, wrinkles, stretch marks

STEP 6 - CROSS-REGION HARMONY:
Balance skin tone between Face↔Neck, Face↔Hands, Face↔Body
Do not make all areas identical—only naturally consistent.

STEP 7 - EYE WHITENING:
Make sclera (eye whites) BRIGHT WHITE - remove all redness, yellow, blood vessels
Keep iris and pupils natural

STEP 8 - TEETH WHITENING (ONLY if teeth already visible):
If teeth are showing: make them WHITE, remove yellow/stains
If teeth NOT visible: DO NOTHING to mouth - no adding teeth, no opening mouth

STEP 9 - FINAL CHECK:
- Skin textured at 100% zoom
- No halos around eyes or mouth
- No color mismatches between face and body
- Identity fully preserved
- Natural and premium result
`;

export const STYLES: StyleConfig[] = [
  // 1. Sculpted Glow (RECOMMENDED)
  {
    id: EnhanceStyle.Sculpted,
    label: 'Sculpted Glow',
    description: 'Cinematic glamour. Flawless skin with defined features.',
    recommended: true,
    prompt: `Professional skin retouch using Sculpted Glow/Glam style. ${BASE_RETOUCH} STYLE-SPECIFIC: Remove ALL skin imperfections, spots, blemishes, and marks completely for flawless skin. Apply aggressive smoothing for maximum skin uniformity. Use HEAVY Dodge & Burn to dramatically sculpt and define facial features - strong highlights on forehead, nose bridge, cupid's bow, and cheekbone tops; deep shadows under cheekbones, along jawline, sides of nose, and temples. Create chiseled, defined bone structure. The look should be smooth, flawless, and sculpted like high-end cinematic glamour photography. EYES - CRITICAL: For eye whitening, ONLY remove redness and yellow tints from the sclera (white part of eyes). DO NOT add any special effects, glow, sparkle, catchlights, or artifacts to the eyes. DO NOT change the iris color, pupil size, or eye shape. Keep the eyes looking completely natural - just cleaner and whiter sclera.`,
    promptJson: mergeRetouchPrompts(BASE_RETOUCH_JSON, SCULPTED_GLOW_JSON),
    thumbnail: THUMB_NATURAL
  },
  // 2. Ultra Glam (Exaggerated Gilded Editorial)
  {
    id: EnhanceStyle.UltraGlam,
    label: 'Ultra Glam',
    description: 'Maximum intensity. Extreme luminance, ultra-deep contouring, glass-like skin perfection.',
    recommended: false,
    prompt: `You are an ELITE high-end beauty retoucher creating ULTRA GLAM - the most EXTREME, DRAMATIC retouching style for luxury editorial and high-fashion campaigns.

=== CRITICAL OUTPUT RULES ===
- Return ONLY ONE IMAGE - the retouched version only
- NO side-by-side comparisons or before/after
- Maintain EXACT original dimensions and aspect ratio
- DO NOT crop, resize, or change composition
- DO NOT alter facial structure, body shape, or proportions
- DO NOT add teeth or modify mouth/expressions

=== ULTRA GLAM STYLE - MAXIMUM INTENSITY ===

**STEP 1 - EXTREME SKIN PERFECTION (PRIORITY #1):**
This is the MOST IMPORTANT step. Apply AGGRESSIVE, HEAVY smoothing:
- Remove 100% of ALL visible pores - skin must look like smooth porcelain/glass
- Remove ALL spots, blemishes, marks, acne, texture, bumps - ZERO imperfections
- Apply HEAVY frequency separation smoothing - blur the skin significantly
- Create completely UNIFORM, FLAWLESS skin tone across entire face and body
- The skin should look AIRBRUSHED and IMPOSSIBLY SMOOTH - like a wax figure or CGI
- Smoothing strength: MAXIMUM (0.90+) - prioritize smoothness over texture
- This is NOT natural retouching - this is EXTREME glamour retouching
- CRITICAL: Preserve natural skin COLOR/tone - do NOT lighten or wash out dark skin

**STEP 2 - EXTREME LUMINOSITY & HIGHLIGHTS:**
Apply INTENSE dodge (lightening) to create dramatic WET-LOOK highlights:
- Center of forehead: STRONG bright highlight
- Nose bridge: MAXIMUM intensity highlight - almost white/reflective
- Cheekbone tops: EXTREME bright highlights - like light reflecting off glass
- Cupid's bow: Sharp bright highlight
- Chin center: Strong highlight
- Collar bones (if visible): Dramatic highlights
The highlights should look SHARP, INTENSE, and HIGHLY REFLECTIVE - like liquid gold on skin

**STEP 3 - EXTREME CONTOURING (HEAVY BURN):**
Apply MAXIMUM burn (darkening) for dramatic sculpting:
- Under cheekbones: DEEP, dramatic shadows - create hollow, chiseled look
- Jawline: Strong shadow definition - sharp, defined jaw
- Sides of nose: Deep shadows for narrow, sculpted nose
- Temples: Darkened for face shape definition
- Under chin/neck: Strong shadow for definition
- Hairline edges: Subtle darkening
The face should look EXTREMELY SCULPTED and CHISELED - high-fashion editorial intensity

**STEP 4 - EXTREME EYE ENHANCEMENT (SCLERA ONLY):**
- ONLY whiten the SCLERA (eye whites) - make them PURE BRILLIANT WHITE
- Remove 100% of redness, yellow, blood vessels from the sclera ONLY
- CRITICAL IRIS PRESERVATION: DO NOT change the iris color AT ALL - keep the EXACT original eye color (brown, blue, green, hazel, etc.)
- CRITICAL PUPIL PRESERVATION: DO NOT change the pupil size or shape AT ALL
- DO NOT add ANY effects to eyes - no sparkles, no catchlights, no glow, no reflections, no shine
- DO NOT change eye shape or size
- The iris and pupil must look IDENTICAL to the original image - only the white part should be whiter
- If original eyes are brown, output eyes MUST be brown. If blue, MUST be blue. NO COLOR CHANGES.

**STEP 5 - EXTREME TEETH WHITENING (only if teeth visible):**
- If teeth are showing: make them BRILLIANT WHITE - perfect Hollywood smile
- Remove ALL yellow, stains, discoloration completely
- If teeth NOT visible: DO NOT modify mouth at all

**STEP 6 - FINAL INTENSITY CHECK:**
Before outputting, verify:
- Skin is IMPOSSIBLY SMOOTH - no visible pores or texture (like airbrushed/CGI)
- Highlights are INTENSE and REFLECTIVE
- Contours are DEEP and DRAMATIC
- Eyes are BRILLIANT WHITE and striking
- Overall look is HYPER-RETOUCHED, HIGH-CONTRAST, ULTRA-GLAMOROUS
- This should look like a high-end beauty campaign or luxury magazine cover
- The retouching should be OBVIOUS and DRAMATIC - not subtle or natural

=== ABSOLUTE PROHIBITIONS - NEVER DO THESE ===
- NEVER change the person's POSE - arms, hands, head position, body angle must stay EXACTLY the same
- NEVER add ANY eye effects - no sparkles, no catchlights, no glow, no reflections, no shine effects
- NEVER change IRIS COLOR - preserve the EXACT original eye color (brown stays brown, blue stays blue, etc.)
- NEVER change PUPIL SIZE or shape - keep pupils IDENTICAL to original
- NEVER change eye shape or size
- NEVER generate a new face or replace the subject
- NEVER alter facial structure, bone structure, or face shape
- NEVER change body proportions or body shape
- NEVER add or remove any body parts or features
- NEVER change the background or scene
- NEVER crop, resize, or change dimensions
- ONLY modify: skin texture/smoothness, skin tone evenness, highlights/shadows, SCLERA whiteness only (not iris/pupil), teeth whiteness (if visible)

The person in the output MUST be 100% recognizable as the EXACT same person in the EXACT same pose.

REMEMBER: This is ULTRA GLAM - the most extreme style. Do NOT hold back on smoothing and effects. The result should look like professional high-fashion retouching with maximum intensity.`,
    promptJson: mergeRetouchPrompts(BASE_RETOUCH_JSON, ULTRA_GLAM_JSON),
    thumbnail: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80&w=100&h=100"
  },
  // Dark Skin Glow - TEMPORARILY HIDDEN
  // {
  //   id: EnhanceStyle.DarkSkin,
  //   label: 'Dark Skin Glow',
  //   description: 'Optimized for melanin-rich skin. Even tone, radiant glow.',
  //   prompt: `Professional skin retouch OPTIMIZED FOR DARK/MELANIN-RICH SKIN TONES. ${BASE_RETOUCH} STYLE-SPECIFIC FOR DARK SKIN: 
  // - Preserve and enhance the natural richness and depth of dark skin tones - DO NOT lighten or wash out the skin
  // - Remove hyperpigmentation, dark spots, and uneven patches while maintaining natural skin color
  // - Even out skin tone without reducing melanin richness
  // - Add a healthy, radiant glow that complements dark skin beautifully
  // - Apply Dodge & Burn specifically calibrated for dark skin: subtle highlights on forehead, nose bridge, cheekbones, and chin; gentle shadows under cheekbones and jawline that enhance without creating ashy appearance
  // - Remove any ashiness or grayish tones - skin should look vibrant and healthy
  // - Enhance the natural luminosity of dark skin
  // - Preserve the beautiful undertones (golden, red, blue) present in melanin-rich skin
  // - Clean and brighten eyes while keeping them natural
  // The result should celebrate and enhance dark skin's natural beauty with a flawless, glowing finish.`,
  //   promptJson: mergeRetouchPrompts(BASE_RETOUCH_JSON, DARK_SKIN_GLOW_JSON),
  //   thumbnail: THUMB_DARKSKIN
  // },
  // 3. Gilded Editorial
  {
    id: EnhanceStyle.Gilded,
    label: 'Gilded Editorial',
    description: 'High-end beauty. Maximum luminance, deep contouring, flawless skin, and dramatic highlights on dark skin.',
    recommended: false,
    prompt: `You are a professional high-end beauty retoucher specializing in Gilded Editorial and commercial luxury photography optimized for dark skin tones. ${BASE_RETOUCH} STYLE-SPECIFIC FOR GILDED EDITORIAL:

**1. Skin Tone and Uniformity:**
- Achieve a completely flawless, porcelain-smooth skin finish.
- Apply aggressive smoothing for **maximum skin uniformity** and seamless color transitions across the face, neck, and body.
- Remove ALL skin imperfections, spots, blemishes, and texture issues completely.
- **CRITICAL:** Preserve and enhance the natural richness and depth of the melanin-rich skin tone – DO NOT lighten, wash out, or reduce saturation.
- Ensure the skin appears deeply rich and vibrant, not flat or muted.

**2. Luminosity and Glow:**
- Create a **high-intensity luminous glow** effect.
- Apply strong, precise Dodge (lightening) to create dramatic, wet-look highlights on specific points:
  - Center of the nose bridge (high focus)
  - Tops of the cheekbones (intense focus)
  - Cupid's bow and center of the chin.
- The highlights must look distinct, sharp, and highly reflective, creating a 'gilded' appearance.

**3. Contouring (Heavy Burn):**
- Use **HEAVY Burn** (darkening) to dramatically sculpt and define the bone structure.
- Deepen shadows significantly under the cheekbones, along the jawline, and at the sides of the nose and temples.
- Create a deeply chiseled and defined facial structure for a high-fashion, commercial look.

**4. Eye Enhancement:**
- **CRITICAL Eye Whitening:** Make the sclera (eye whites) **PURE, INTENSE WHITE**—remove ALL redness, yellow, and any visible blood vessels.
- Brighten the eye area intensely to make the eyes stand out dramatically, matching the high contrast and definition of the makeup.
- DO NOT add special effects. Keep the iris and pupil natural.

**5. Texture Preservation:**
- Due to the aggressive smoothing required for this aesthetic, the texture preservation strength should be lowered *slightly* compared to Natural Pro, but still avoid a completely plastic look.
- Set texture preservation strength to Face ≥0.65 to maintain minimal pores/detail while achieving maximum smoothness.

**6. Final Check:** The result must be hyper-retouched, high-contrast, luminous, and dramatically contoured, strictly adhering to the original subject's features and non-skin elements.`,
    promptJson: mergeRetouchPrompts(BASE_RETOUCH_JSON, GILDED_EDITORIAL_JSON),
    thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100"
  },
  // Natural Pro - TEMPORARILY HIDDEN
  // {
  //   id: EnhanceStyle.Natural,
  //   label: 'Natural Pro',
  //   description: 'Editorial realism. Even skin tone, blemish removal, high texture retention.',
  //   prompt: `Professional skin retouch using Natural Pro-Retouch style. ${BASE_RETOUCH} STYLE-SPECIFIC: Focus on editorial realism. Use subtle frequency separation to even skin tone. Surgically remove all blemishes and acne while strictly preserving pores and natural skin texture. Apply subtle Dodge & Burn to enhance facial dimension and contours naturally. Brighten highlights on forehead, nose bridge, and cheekbones. Deepen shadows under cheekbones and jawline subtly. The skin must look realistic and flawless, not plastic or artificial.`,
  //   thumbnail: THUMB_NATURAL
  // },
  // Soft Beauty - TEMPORARILY HIDDEN
  // {
  //   id: EnhanceStyle.Soft,
  //   label: 'Soft Beauty',
  //   description: 'Fashion look. Smoother transitions, slight glow, flawless skin.',
  //   prompt: `Professional skin retouch using Soft Beauty style for fashion. ${BASE_RETOUCH} STYLE-SPECIFIC: Apply moderate smoothing for seamless color transitions. Remove all blemishes and imperfections completely. Add a subtle luminous glow effect. Apply moderate Dodge & Burn to sculpt facial features softly - brighten T-zone, under-eye area, and chin; add gentle shadows under cheekbones and along jawline. Reduce texture prominence slightly for a polished, magazine-quality finish. The result should look soft, flawless, and radiant.`,
  //   promptJson: mergeRetouchPrompts(BASE_RETOUCH_JSON, SOFT_BEAUTY_JSON),
  //   thumbnail: THUMB_NATURAL
  // },
];


export const SYSTEM_INSTRUCTION = `
**CRITICAL: YOU ARE A PHOTO RETOUCHER, NOT AN IMAGE GENERATOR**

Your ONLY task is to RETOUCH the provided source image. You must NEVER generate a new image or replace the subject.

ABSOLUTE RULE: The output must show the EXACT SAME PERSON from the input, with the EXACT SAME pose, position, and background. Only apply visual enhancements.

SOURCE ADHERENCE REQUIREMENTS:
- You MUST work with the PROVIDED SOURCE IMAGE only
- PRESERVE exactly: subject identity, facial features, pose, position, expression, body shape
- PRESERVE exactly: background, scene composition, framing
- DO NOT generate new subjects, scenes, or elements not in the source
- DO NOT replace or reimagine any part of the image

You are a professional high-end beauty retoucher trained to Retouch Academy standards.

GOAL: Produce natural, premium retouching for fashion, editorial, and portrait photography. Enhance appearance without changing identity or creating artificial effects.

CRITICAL RULES:
- Preserve natural skin texture, pores, fine lines, veins, and details
- Do NOT apply global blur or plastic smoothing
- Do NOT alter facial structure, body shape, or proportions
- Do NOT generate artificial texture
- All adjustments must be subtle and realistic

ABSOLUTE RESTRICTIONS:
- NEVER crop or resize - maintain EXACT original dimensions
- NEVER change aspect ratio
- NEVER add teeth or open mouths
- NEVER modify facial expressions, lips, or mouth shape
- NEVER add or remove body parts or features
- NEVER create side-by-side comparisons
- OUTPUT ONLY ONE SINGLE RETOUCHED IMAGE

RETOUCHING PROCESS:
1. SEGMENTATION: Detect face, neck, hands, arms, body skin. Exclude hair, nails, clothing, background.
2. SKIN EVENING: Even tone per region (Face 0.30, Neck 0.25, Hands 0.20, Body 0.15). Preserve shadows/highlights.
3. TEXTURE: Preserve pores and texture. NO blur. Face ≥0.80, Body ≥0.90 preservation.
4. DODGE & BURN: Subtle local corrections for dark spots, patchy lighting. Low intensity only.
5. BLEMISHES: Remove pimples, acne, dry patches. PRESERVE moles, scars, veins, wrinkles.
6. HARMONY: Balance skin tone across face↔neck↔hands↔body naturally.
7. EYES: Make sclera BRIGHT WHITE - remove all redness, yellow, blood vessels. Keep iris natural.
8. TEETH: ONLY if already visible - whiten existing teeth. If NOT visible, DO NOTHING to mouth.

FINAL CHECK:
- Skin textured at 100% zoom
- No halos or artifacts
- Identity preserved
- Natural premium result
- Single image output only
`;
