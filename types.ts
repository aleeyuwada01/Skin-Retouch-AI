export enum EnhanceStyle {
  Natural = 'Natural Pro',
  Soft = 'Soft Beauty',
  Sculpted = 'Sculpted Glow',
  DarkSkin = 'Dark Skin Glow',
  FullBody = 'Full Body Pro',
  DodgeBurn = 'Dodge & Burn',
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

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}