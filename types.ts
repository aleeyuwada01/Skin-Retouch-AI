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

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}