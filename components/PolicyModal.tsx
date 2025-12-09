import React from 'react';
import { X, FileText, Mail, Shield } from 'lucide-react';
import { Button } from './Button';

export type PolicyType = 'privacy' | 'terms' | 'contact' | null;

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: PolicyType;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen || !type) return null;

  const getTitle = () => {
    switch (type) {
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms of Service';
      case 'contact': return 'Contact Support';
      default: return '';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'privacy': return <Shield className="text-[#dfff00]" size={24} />;
      case 'terms': return <FileText className="text-[#dfff00]" size={24} />;
      case 'contact': return <Mail className="text-[#dfff00]" size={24} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {type === 'privacy' && (
            <div className="space-y-4 text-neutral-400 text-sm leading-relaxed">
              <p>Last updated: October 26, 2023</p>
              <h3 className="text-white font-bold text-base mt-4">1. Information We Collect</h3>
              <p>We collect information you provide directly to us when you create an account, specifically your name and email address. We also collect usage data related to the images you process to enforce limits.</p>
              
              <h3 className="text-white font-bold text-base mt-4">2. Image Processing Privacy</h3>
              <p>Images uploaded to Skin Retoucher AI are processed in real-time by our AI engine. We do not store your original or processed images on our servers permanently. They are processed in memory and discarded immediately after the session or download.</p>
              
              <h3 className="text-white font-bold text-base mt-4">3. Local Storage</h3>
              <p>We use local storage on your device to manage your session and daily usage limits. This data stays on your device.</p>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-4 text-neutral-400 text-sm leading-relaxed">
              <p>Welcome to Skin Retoucher AI.</p>
              <h3 className="text-white font-bold text-base mt-4">1. Usage License</h3>
              <p>We grant you a personal, non-exclusive license to use the software for image retouching purposes. The Free plan is limited to 5 images per day.</p>
              
              <h3 className="text-white font-bold text-base mt-4">2. Acceptable Use</h3>
              <p>You agree not to misuse the services. You must not upload illegal, harmful, or explicitly banned content as defined by our safety filters.</p>
              
              <h3 className="text-white font-bold text-base mt-4">3. Disclaimer</h3>
              <p>The service is provided "as is". We make no warranties regarding the specific outcome of the AI retouching on every image.</p>
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-6">
              <p className="text-neutral-400 text-sm">Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.</p>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); alert('Message sent!'); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400 uppercase">First Name</label>
                    <input type="text" className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-neutral-400 uppercase">Last Name</label>
                    <input type="text" className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 uppercase">Email</label>
                  <input type="email" className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 uppercase">Message</label>
                  <textarea rows={4} className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none resize-none"></textarea>
                </div>

                <Button className="w-full">Send Message</Button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        {type !== 'contact' && (
           <div className="p-6 border-t border-white/5 bg-[#161616] shrink-0 rounded-b-2xl">
             <Button onClick={onClose} variant="secondary" className="w-full">Close</Button>
           </div>
        )}
      </div>
    </div>
  );
};