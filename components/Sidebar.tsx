import React from 'react';
import { Sparkles, Wand2, Battery, X, Layers, CreditCard } from 'lucide-react';
import { EnhanceStyle } from '../types';
import { STYLES } from '../constants';
import { Button } from './Button';

interface SidebarProps {
  selectedStyle: EnhanceStyle;
  onStyleSelect: (style: EnhanceStyle) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  onEnhance: () => void;
  isProcessing: boolean;
  onOpenTips: () => void;
  hasImage: boolean;
  canEnhance: boolean;
  remainingCredits: number;
  isOpen?: boolean;
  onClose?: () => void;
  batchCount?: number;
  onTopUp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedStyle,
  onStyleSelect,
  customPrompt,
  onCustomPromptChange,
  onEnhance,
  isProcessing,
  hasImage,
  canEnhance,
  remainingCredits,
  isOpen = false,
  onClose,
  batchCount = 0,
  onTopUp
}) => {
  const isOutOfCredits = remainingCredits <= 0;
  const isBatch = batchCount > 1;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-[85%] max-w-[320px] md:relative md:w-[360px] md:translate-x-0
        flex flex-col bg-[#161616] h-full shadow-2xl z-50 border-r md:border-l md:border-r-0 border-white/5
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Sparkles className="text-white" size={20} />
              <span>Skin Retoucher</span>
            </h2>
            {onClose && (
              <button 
                onClick={onClose}
                className="md:hidden p-1 text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <p className="text-neutral-500 text-sm mt-2">Select enhance type:</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
          {/* Style Selection List */}
          <div className="space-y-3" data-tutorial="style-list">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => onStyleSelect(style.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group text-left border ${
                  selectedStyle === style.id
                    ? 'bg-neutral-800 border-neutral-700'
                    : 'bg-transparent border-transparent hover:bg-neutral-800/50 hover:border-neutral-800'
                }`}
              >
                <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 mt-0.5">
                  <img src={style.thumbnail} alt={style.label} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-medium text-sm ${selectedStyle === style.id ? 'text-white' : 'text-neutral-300'}`}>
                      {style.label}
                    </span>
                    {selectedStyle === style.id && (
                      <div className="w-4 h-4 rounded-full bg-[#dfff00] flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                    {selectedStyle !== style.id && (
                      <div className="w-4 h-4 rounded-full border border-neutral-600 group-hover:border-neutral-500 shrink-0"></div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 leading-snug line-clamp-2">
                    {style.description}
                  </p>
                </div>
              </button>
            ))}

            {/* Custom Prompt Toggle */}
            <button
                onClick={() => onStyleSelect(EnhanceStyle.Custom)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group text-left border ${
                  selectedStyle === EnhanceStyle.Custom
                     ? 'bg-neutral-800 border-neutral-700'
                    : 'bg-transparent border-transparent hover:bg-neutral-800/50 hover:border-neutral-800'
                }`}
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-500 mt-0.5">
                   <Wand2 size={20} />
                </div>
                
                 <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-medium text-sm ${selectedStyle === EnhanceStyle.Custom ? 'text-white' : 'text-neutral-300'}`}>
                      Custom Edit
                    </span>
                     {selectedStyle === EnhanceStyle.Custom ? (
                      <div className="w-4 h-4 rounded-full bg-[#dfff00] flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-600 group-hover:border-neutral-500 shrink-0"></div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 leading-snug">
                    Describe your own retouching needs.
                  </p>
                </div>
              </button>
          </div>

          {/* Custom Input Area (Conditional) */}
          {selectedStyle === EnhanceStyle.Custom && (
            <div className="pt-1 animate-in slide-in-from-top-2 duration-200">
              <textarea
                value={customPrompt}
                onChange={(e) => onCustomPromptChange(e.target.value)}
                placeholder="Describe your edit (e.g., 'Remove the background', 'Black and white')..."
                className={`w-full bg-[#111] border rounded-xl p-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#dfff00] min-h-[100px] resize-none transition-colors ${
                   !customPrompt.trim() && selectedStyle === EnhanceStyle.Custom ? 'border-red-900/50 focus:border-red-500' : 'border-neutral-700'
                }`}
              />
              {!customPrompt.trim() && (
                <p className="text-xs text-red-400 mt-1.5 ml-1">Please enter a description.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-6 mt-auto border-t border-white/5 bg-[#161616]">
          <div className="flex items-center justify-between mb-3 px-1">
             <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
               <Battery size={14} className={isOutOfCredits ? "text-red-500" : "text-[#dfff00]"} />
               Credits
             </span>
             <span className={`text-xs font-bold ${isOutOfCredits ? "text-red-500" : "text-white"}`}>
               {remainingCredits} available
             </span>
          </div>
          
          {isOutOfCredits ? (
            <button 
              className="w-full font-bold text-sm h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2"
              onClick={onTopUp}
            >
              <CreditCard size={16} />
              Top Up Credits
            </button>
          ) : (
            <Button 
              onClick={onEnhance} 
              isLoading={isProcessing} 
              className="w-full font-bold text-sm h-12"
              disabled={!hasImage || !canEnhance}
              data-tutorial="enhance-button"
            >
              {isProcessing ? 'Processing...' : (
                <span className="flex items-center gap-2">
                  {isBatch ? `Batch Retouch (${batchCount})` : 'Retouch Image'}
                  {isBatch ? <Layers size={14} className="fill-current" /> : <Sparkles size={14} className="fill-current" />}
                </span>
              )}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
};