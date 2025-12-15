import { EnhanceStyle, StyleConfig, LogoOverlayState } from './types';

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

// Thumbnails for different styles
const THUMB_NATURAL = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_SCULPTED = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_DARKSKIN = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=100&h=100";

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
    thumbnail: THUMB_SCULPTED
  },
  // 2. Dark Skin Glow
  {
    id: EnhanceStyle.DarkSkin,
    label: 'Dark Skin Glow',
    description: 'Optimized for melanin-rich skin. Even tone, radiant glow.',
    prompt: `Professional skin retouch OPTIMIZED FOR DARK/MELANIN-RICH SKIN TONES. ${BASE_RETOUCH} STYLE-SPECIFIC FOR DARK SKIN: 
- Preserve and enhance the natural richness and depth of dark skin tones - DO NOT lighten or wash out the skin
- Remove hyperpigmentation, dark spots, and uneven patches while maintaining natural skin color
- Even out skin tone without reducing melanin richness
- Add a healthy, radiant glow that complements dark skin beautifully
- Apply Dodge & Burn specifically calibrated for dark skin: subtle highlights on forehead, nose bridge, cheekbones, and chin; gentle shadows under cheekbones and jawline that enhance without creating ashy appearance
- Remove any ashiness or grayish tones - skin should look vibrant and healthy
- Enhance the natural luminosity of dark skin
- Preserve the beautiful undertones (golden, red, blue) present in melanin-rich skin
- Clean and brighten eyes while keeping them natural
The result should celebrate and enhance dark skin's natural beauty with a flawless, glowing finish.`,
    thumbnail: THUMB_DARKSKIN
  },
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
    thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100"
  },
  // 4. Ultra Glam (Exaggerated Gilded Editorial)
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

**STEP 4 - EXTREME EYE ENHANCEMENT:**
- Make sclera (eye whites) PURE BRILLIANT WHITE - remove 100% of redness, yellow, blood vessels
- Eyes should be the BRIGHTEST, most STRIKING feature of the face
- Brighten entire eye area intensely - remove all darkness/shadows around eyes
- Make eyes POP dramatically
- Keep iris and pupil natural - NO special effects, sparkles, or catchlights

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
- NEVER change eye color, pupil size, or eye shape
- NEVER generate a new face or replace the subject
- NEVER alter facial structure, bone structure, or face shape
- NEVER change body proportions or body shape
- NEVER add or remove any body parts or features
- NEVER change the background or scene
- NEVER crop, resize, or change dimensions
- ONLY modify: skin texture/smoothness, skin tone evenness, highlights/shadows, eye whites (remove redness only), teeth whiteness (if visible)

The person in the output MUST be 100% recognizable as the EXACT same person in the EXACT same pose.

REMEMBER: This is ULTRA GLAM - the most extreme style. Do NOT hold back on smoothing and effects. The result should look like professional high-fashion retouching with maximum intensity.`,
    thumbnail: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80&w=100&h=100"
  },
  // Natural Pro - TEMPORARILY HIDDEN
  // {
  //   id: EnhanceStyle.Natural,
  //   label: 'Natural Pro',
  //   description: 'Editorial realism. Even skin tone, blemish removal, high texture retention.',
  //   prompt: `Professional skin retouch using Natural Pro-Retouch style. ${BASE_RETOUCH} STYLE-SPECIFIC: Focus on editorial realism. Use subtle frequency separation to even skin tone. Surgically remove all blemishes and acne while strictly preserving pores and natural skin texture. Apply subtle Dodge & Burn to enhance facial dimension and contours naturally. Brighten highlights on forehead, nose bridge, and cheekbones. Deepen shadows under cheekbones and jawline subtly. The skin must look realistic and flawless, not plastic or artificial.`,
  //   thumbnail: THUMB_NATURAL
  // },
  // Soft Beauty
  {
    id: EnhanceStyle.Soft,
    label: 'Soft Beauty',
    description: 'Fashion look. Smoother transitions, slight glow, flawless skin.',
    prompt: `Professional skin retouch using Soft Beauty style for fashion. ${BASE_RETOUCH} STYLE-SPECIFIC: Apply moderate smoothing for seamless color transitions. Remove all blemishes and imperfections completely. Add a subtle luminous glow effect. Apply moderate Dodge & Burn to sculpt facial features softly - brighten T-zone, under-eye area, and chin; add gentle shadows under cheekbones and along jawline. Reduce texture prominence slightly for a polished, magazine-quality finish. The result should look soft, flawless, and radiant.`,
    thumbnail: THUMB_NATURAL
  },
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
