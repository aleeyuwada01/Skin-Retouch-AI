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
const THUMB_SOFT = "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_SCULPTED = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_DARKSKIN = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_FULLBODY = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_DODGEBURN = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100";

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
    prompt: `You are an ELITE high-end beauty retoucher creating ULTRA GLAM - the most intense, dramatic retouching style for luxury editorial and high-fashion campaigns. ${BASE_RETOUCH} STYLE-SPECIFIC FOR ULTRA GLAM:

**1. EXTREME Skin Perfection:**
- Achieve ABSOLUTE glass-like, porcelain-perfect skin finish - zero imperfections visible.
- Apply MAXIMUM smoothing for complete skin uniformity - seamless like airbrushed perfection.
- Remove EVERY skin imperfection, spot, blemish, pore visibility, and texture issue completely.
- **CRITICAL:** Preserve the natural richness of skin tone – DO NOT lighten or wash out.
- Skin must appear impossibly smooth, luminous, and flawless.

**2. EXTREME Luminosity and Glow:**
- Create an **ULTRA high-intensity luminous glow** - skin should appear to glow from within.
- Apply INTENSE, precise Dodge to create dramatic, wet-glass highlights:
  - Center of forehead (strong focus)
  - Center of the nose bridge (MAXIMUM intensity)
  - Tops of the cheekbones (EXTREME intensity - almost reflective)
  - Cupid's bow, center of chin, and collar bones.
- Highlights must look sharp, intense, and highly reflective - like liquid gold on skin.

**3. EXTREME Contouring (Maximum Burn):**
- Use **MAXIMUM Burn** to dramatically sculpt and define bone structure to the extreme.
- Create DEEP, dramatic shadows under cheekbones, along jawline, sides of nose, temples, and under chin.
- The facial structure should look extremely chiseled, defined, and sculpted - high-fashion editorial intensity.

**4. EXTREME Eye Enhancement:**
- **CRITICAL:** Make sclera **PURE BRILLIANT WHITE** - remove ALL redness, yellow, blood vessels completely.
- Eyes should look dramatically bright and striking - the focal point of the face.
- Brighten the entire eye area intensely for maximum impact.
- DO NOT add special effects. Keep iris and pupil natural but make them pop.

**5. EXTREME Teeth Whitening (if visible):**
- If teeth are showing: make them BRILLIANT WHITE - perfect Hollywood smile.
- Remove all yellow, stains, and imperfections completely.

**6. Texture - Glass Skin Effect:**
- Texture preservation: Face ≥0.50 - prioritize smoothness over texture.
- Achieve the "glass skin" K-beauty effect - smooth, luminous, reflective.
- Minimal pore visibility - skin should look like polished porcelain.

**7. Final Check:** The result must be HYPER-retouched, MAXIMUM contrast, EXTREME luminosity, and ULTRA-sculpted. This is the most dramatic, intense retouching style - suitable for high-fashion campaigns and luxury beauty editorials.`,
    thumbnail: "https://images.unsplash.com/photo-1596075780750-81249df16d19?auto=format&fit=crop&q=80&w=100&h=100"
  },
  // 5. Natural Pro
  {
    id: EnhanceStyle.Natural,
    label: 'Natural Pro',
    description: 'Editorial realism. Even skin tone, blemish removal, high texture retention.',
    prompt: `Professional skin retouch using Natural Pro-Retouch style. ${BASE_RETOUCH} STYLE-SPECIFIC: Focus on editorial realism. Use subtle frequency separation to even skin tone. Surgically remove all blemishes and acne while strictly preserving pores and natural skin texture. Apply subtle Dodge & Burn to enhance facial dimension and contours naturally. Brighten highlights on forehead, nose bridge, and cheekbones. Deepen shadows under cheekbones and jawline subtly. The skin must look realistic and flawless, not plastic or artificial.`,
    thumbnail: THUMB_NATURAL
  },
  // 5. Soft Beauty
  {
    id: EnhanceStyle.Soft,
    label: 'Soft Beauty',
    description: 'Fashion look. Smoother transitions, slight glow, flawless skin.',
    prompt: `Professional skin retouch using Soft Beauty style for fashion. ${BASE_RETOUCH} STYLE-SPECIFIC: Apply moderate smoothing for seamless color transitions. Remove all blemishes and imperfections completely. Add a subtle luminous glow effect. Apply moderate Dodge & Burn to sculpt facial features softly - brighten T-zone, under-eye area, and chin; add gentle shadows under cheekbones and along jawline. Reduce texture prominence slightly for a polished, magazine-quality finish. The result should look soft, flawless, and radiant.`,
    thumbnail: THUMB_SOFT
  },
  // 6. Dodge & Burn
  {
    id: EnhanceStyle.DodgeBurn,
    label: 'Dodge & Burn',
    description: 'Professional contouring. Sculpt and define with light and shadow.',
    prompt: `You are a professional high-end beauty retoucher specializing in DODGE & BURN CONTOURING.

YOUR TASK: Apply professional dodge and burn technique to sculpt, contour, and define facial features using light and shadow manipulation.

CRITICAL - DO NOT CHANGE:
- DO NOT crop, resize, or change the aspect ratio
- Maintain EXACT original dimensions and composition
- Return ONLY ONE IMAGE - the retouched version
- NO side-by-side comparisons

DODGE & BURN TECHNIQUE:
This is a professional retouching technique that uses selective lightening (dodge) and darkening (burn) to:
- Sculpt and define facial bone structure
- Create depth and dimension
- Even out skin tones and lighting
- Enhance natural contours without changing features

PHASE 1 - MICRO DODGE & BURN (Skin Evening):
- Even out small patches of uneven skin tone
- Remove dark spots, hyperpigmentation patches
- Reduce under-eye darkness and shadows
- Even out redness and discoloration
- Smooth transitions between light and shadow areas
- Strength: 0.25-0.35 for face, 0.20-0.30 for body

PHASE 2 - MACRO DODGE & BURN (Contouring):
DODGE (Lighten) these areas:
- Center of forehead
- Bridge of nose
- Tip of nose
- Under-eye area (to brighten)
- Top of cheekbones
- Cupid's bow (above upper lip)
- Center of chin
- Collar bones (if visible)

BURN (Darken) these areas:
- Temples (sides of forehead)
- Sides of nose
- Under cheekbones (hollow area)
- Jawline definition
- Under chin/neck shadow
- Hairline edges

PHASE 3 - SKIN TEXTURE PRESERVATION:
- Preserve ALL natural skin texture, pores, and fine lines
- NO smoothing or blurring
- Texture preservation: ≥0.85 minimum
- The dodge & burn should only affect luminosity, not texture

PHASE 4 - BLEMISH REMOVAL:
- Remove temporary blemishes: pimples, acne, dry patches
- PRESERVE: moles, beauty marks, natural wrinkles, scars

PHASE 5 - EYE ENHANCEMENT:
- Brighten sclera (eye whites) - remove redness and yellow
- Keep iris and pupils completely natural
- Subtle brightening around eye area

PHASE 6 - TEETH (ONLY if visible):
- If teeth are showing: whiten and brighten
- If teeth NOT visible: DO NOT modify mouth

STRICT PROHIBITIONS:
- DO NOT add teeth or open mouths
- DO NOT change facial expressions
- DO NOT alter facial structure or proportions
- DO NOT apply plastic/waxy smoothing
- DO NOT crop or resize

The result should look like professional editorial retouching with beautifully sculpted features, enhanced dimension, and flawless yet natural-looking skin.`,
    thumbnail: THUMB_DODGEBURN
  }
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
