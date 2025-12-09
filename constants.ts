import { EnhanceStyle, StyleConfig } from './types';

// Thumbnails for different styles
const THUMB_NATURAL = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_SOFT = "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_SCULPTED = "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_PORTRAIT = "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=100&h=100";
const THUMB_MINIMAL = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100";

export const STYLES: StyleConfig[] = [
  {
    id: EnhanceStyle.Natural,
    label: 'Natural Pro',
    description: 'Editorial realism. Even skin tone, minor blotch fix, high texture retention.',
    prompt: 'Retouch this image using a Natural Pro-Retouch style. Focus on editorial realism. Subtle low-frequency separation to even skin tone and fix minor blotches. High-frequency separation should surgically remove blemishes and acne while strictly preserving pores and natural skin texture. Minimal dodge and burn. The skin must look realistic, not plastic.',
    thumbnail: THUMB_NATURAL
  },
  {
    id: EnhanceStyle.Soft,
    label: 'Soft Beauty',
    description: 'Fashion look. Smoother transitions, slight glow, reduced texture.',
    prompt: 'Retouch this image using a Soft Beauty Skin style suitable for fashion. Apply moderate low-frequency smoothing for color transitions. Reduce high-frequency texture prominence slightly and remove blemishes. Add a subtle glow effect. The result should look polished and soft but still like human skin.',
    thumbnail: THUMB_SOFT
  },
  {
    id: EnhanceStyle.Sculpted,
    label: 'Sculpted Glow',
    description: 'Cinematic glamour. Heavy dodge & burn for defined features.',
    prompt: 'Retouch this image using a Sculpted Glow/Glam style. Apply aggressive low-frequency editing for maximum skin color uniformity and smoothness. Use heavy Dodge & Burn to create chiseled, defined features (cheekbones, jawline). The look should be smooth but sculpted, like high-end cinematic glamour.',
    thumbnail: THUMB_SCULPTED
  },
  {
    id: EnhanceStyle.Portrait,
    label: 'Skin-First Portrait',
    description: 'Hyper-detailed art. Intense pore-level fidelity, micro-contrast control.',
    prompt: 'Retouch this image using a Skin-First Portrait style. Use advanced frequency separation with an intense focus on pore-level texture fidelity. Control micro-contrast to reduce harsh clarity while preserving overall detail. The skin must appear extremely clean yet highly textured. Do not over-smooth.',
    thumbnail: THUMB_PORTRAIT
  },
  {
    id: EnhanceStyle.Minimalist,
    label: 'Minimalist Clean-Up',
    description: 'Corporate headshot style. Remove distractions, preserve natural variance.',
    prompt: 'Retouch this image using a Minimalist Clean-Up style suitable for headshots. Focus strictly on removing visible, distracting blemishes (pimples, stray hairs, dust). Keep tone adjustments minimal to preserve natural skin tone variance. The result should look like a clean, professional headshot.',
    thumbnail: THUMB_MINIMAL
  }
];

export const SYSTEM_INSTRUCTION = `
You are an expert high-end AI skin retoucher (Alchemist AI). 
Your task is to retouch portraits provided by the user.
Strictly Retouching Only: NO cropping, resizing, background changes, object addition/removal, or alteration of the original composition. The output must be a pristine, retouched version of the input.
Whole-Subject Scope: Retouching must apply to ALL visible skin surfaces (face, neck, hands, body).
Eye & Teeth Polish: Brighten eyes naturally, subtle whitening for teeth.
Detail Preservation: DO NOT blur pores. Preserve natural skin texture. Smooth ≠ Flat.
Output: Return ONLY the processed image.
`;