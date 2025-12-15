export enum EnhanceStyle {
  Natural = 'Natural Pro',
  Soft = 'Soft Beauty',
  Sculpted = 'Sculpted Glow',
  DarkSkin = 'Dark Skin Glow',
  Gilded = 'Gilded Editorial',
  UltraGlam = 'Ultra Glam',
  Custom = 'Custom Edit'
}

export interface ProcessingState {
  status: 'idle' | 'queue' | 'processing' | 'complete' | 'error';
  error: string | null;
}

export interface HistoryItem {
  id: string;
  original: string; // Base64 or URL
  processed: string; // Base64 or URL
  style: EnhanceStyle;
  timestamp: number;
}

export interface StyleConfig {
  id: EnhanceStyle;
  label: string;
  description: string; // Used for UI display
  prompt: string;
  promptJson?: RetouchPromptJSON; // New JSON prompt (Requirements: 7.1)
  thumbnail: string; // URL for the style preview
  recommended?: boolean; // Show recommended badge
}

export interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedUrl?: string;
  error?: string;
}

export interface Folder {
  id: string;
  name: string;
  items: HistoryItem[];
  createdAt: number;
}

/**
 * Represents a history item stored in local storage.
 * Used for offline access and cross-device sync tracking.
 */
export interface LocalHistoryItem {
  id: string;
  thumbnail: string; // Compressed base64 thumbnail
  style: EnhanceStyle;
  timestamp: number;
  lastEditState: 'original' | 'processed' | 'background_changed';
  isRemote: boolean; // Indicates if synced to Supabase
  remoteId?: string; // Supabase record ID (optional)
}

/**
 * Represents the state of a logo overlay element.
 * Used to capture and restore logo state during background replacement operations.
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export interface LogoOverlayState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  zIndex: number;
}

// ============================================
// JSON Prompt Migration Interfaces
// Requirements: 7.1
// ============================================

/**
 * Represents a discrete operation in the retouching pipeline.
 * Each step defines a specific retouching operation with target area and intensity.
 * Requirements: 7.1
 */
export interface RetouchingStep {
  step_name: string;
  target_area: string;
  operation: string;
  intensity?: number;  // 0.0 - 1.0
  value?: string;
  details: string;
}

/**
 * Output settings for the retouched image.
 * Requirements: 7.1
 */
export interface OutputSettings {
  aspect_ratio: 'maintain_original' | string;
  resolution: 'maintain_original' | string;
  format: 'jpeg' | 'png' | 'webp';
  comparison: boolean;
}

/**
 * Global style configuration for the retouching operation.
 * Requirements: 7.1
 */
export interface GlobalStyle {
  aesthetic_goal: string;
  prohibitions: string;
  final_check: string;
}

/**
 * Metadata for the retouch prompt.
 * Requirements: 7.1
 */
export interface RetouchPromptMetadata {
  original_label: string;
  description: string;
}

/**
 * Main JSON structure for retouch style prompts.
 * Provides structured format for image generation models.
 * Requirements: 1.1, 7.1
 */
export interface RetouchPromptJSON {
  task_type: 'image_retouching';
  input_image_id: string;
  style_profile: string;
  output_settings: OutputSettings;
  retouching_steps: RetouchingStep[];
  global_style: GlobalStyle;
  metadata: RetouchPromptMetadata;
}

/**
 * JSON structure for source adherence guardrails.
 * Contains safety constraints to prevent AI from generating new images.
 * Requirements: 3.1, 7.1
 */
export interface GuardrailJSON {
  protocol: string;
  mandatory_requirements: string[];
  absolute_prohibitions: string[];
  allowed_modifications: string[];
  identity_rule: string;
}

/**
 * JSON structure for system-level AI instructions.
 * Defines global behavior rules and restrictions for the AI model.
 * Requirements: 5.1, 7.1
 */
export interface SystemInstructionJSON {
  role: string;
  absolute_rule: string;
  source_adherence: string[];
  goal: string;
  critical_rules: string[];
  absolute_restrictions: string[];
  retouching_process: RetouchingStep[];
  final_check: string[];
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}