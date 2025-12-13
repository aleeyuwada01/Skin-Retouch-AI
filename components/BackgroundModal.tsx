import React, { useState, useEffect } from 'react';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { supabaseService, Background } from '../services/supabaseService';

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBackground: (backgroundUrl: string) => void;
  isProcessing: boolean;
  remainingCredits: number;
  creditCost: number;
}

// Fallback backgrounds from public folder if no Supabase backgrounds
const FALLBACK_BACKGROUNDS = Array.from({ length: 26 }, (_, i) => ({
  id: `local-${i + 1}`,
  name: `Background ${i + 1}`,
  image_url: `/backgrounds/${i + 1}.jpeg`,
  sort_order: i,
  is_active: true,
  created_at: '',
  updated_at: ''
}));

export const BackgroundModal: React.FC<BackgroundModalProps> = ({
  isOpen,
  onClose,
  onSelectBackground,
  isProcessing,
  remainingCredits,
  creditCost
}) => {
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadBackgrounds();
    }
  }, [isOpen]);

  const loadBackgrounds = async () => {
    setIsLoading(true);
    try {
      const bgs = await supabaseService.getBackgrounds(true);
      // Use Supabase backgrounds if available, otherwise fallback to local
      setBackgrounds(bgs.length > 0 ? bgs : FALLBACK_BACKGROUNDS);
    } catch (error) {
      console.error('Failed to load backgrounds:', error);
      setBackgrounds(FALLBACK_BACKGROUNDS);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedBg && remainingCredits >= creditCost) {
      onSelectBackground(selectedBg);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Change Background</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Select a background to replace the current one
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Background Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#dfff00]" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg.image_url)}
                  disabled={isProcessing}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedBg === bg.image_url
                      ? 'border-[#dfff00] ring-2 ring-[#dfff00]/30'
                      : 'border-transparent hover:border-white/30'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img
                    src={bg.image_url}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedBg === bg.image_url && (
                    <div className="absolute inset-0 bg-[#dfff00]/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-[#dfff00] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <ImageIcon size={16} className="text-neutral-400" />
            <span className="text-neutral-400">
              {selectedBg ? 'Background selected' : 'Select a background'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedBg || isProcessing || remainingCredits < creditCost}
              className="px-6 py-2 rounded-xl bg-[#dfff00] text-black font-bold hover:bg-[#ccff00] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>Apply Background ({creditCost} credit{creditCost > 1 ? 's' : ''})</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
