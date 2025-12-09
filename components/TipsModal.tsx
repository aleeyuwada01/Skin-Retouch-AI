import React from 'react';
import { X, Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="text-[#dfff00]" size={24} />
            Tips for Better Retouching
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <section>
            <h4 className="text-[#dfff00] font-semibold mb-3 uppercase tracking-wider text-sm">Best Practices</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                <span className="text-neutral-300 text-sm"><strong className="text-white">Use High-Resolution Images:</strong> The engine works best when it has fine detail to work with. Low-res images guarantee poor results.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                <span className="text-neutral-300 text-sm"><strong className="text-white">Ensure Proper Lighting:</strong> Use soft light for smoother, more forgiving skin.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                <span className="text-neutral-300 text-sm"><strong className="text-white">Remember the Rule:</strong> Bad lighting = impossible to achieve a smooth, natural look.</span>
              </li>
            </ul>
          </section>

          <section>
            <h4 className="text-orange-400 font-semibold mb-3 uppercase tracking-wider text-sm">Things to Avoid</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                <span className="text-neutral-300 text-sm"><strong className="text-white">Avoid Extremes:</strong> Harsh shadows or blown-out highlights are impossible to fix naturally.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                <span className="text-neutral-300 text-sm"><strong className="text-white">Never Destroy Pores:</strong> Our technique is built around preserving texture. A professional retouch is even and textured, not flat and blurry.</span>
              </li>
            </ul>
          </section>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm text-neutral-400 italic text-center">
              "The goal is to replicate the finesse of a master human retoucher using Frequency Separation and Dodge & Burn methodology."
            </p>
          </div>
        </div>
        
        <div className="p-6 border-t border-neutral-800 bg-neutral-900 sticky bottom-0">
          <button onClick={onClose} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-colors">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};