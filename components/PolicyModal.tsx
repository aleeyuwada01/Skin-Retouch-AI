import React, { useState } from 'react';
import { X, FileText, Mail, Shield, Loader2, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { supabaseService } from '../services/supabaseService';

export type PolicyType = 'privacy' | 'terms' | 'contact' | null;

// Contact Form Component
const ContactForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await supabaseService.submitContactForm(formData);
    
    if (result.success) {
      setSubmitted(true);
      setTicketNumber(result.ticketNumber || null);
    } else {
      setError(result.error || 'Failed to submit. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
        <p className="text-neutral-400 mb-4">Thank you for contacting us. We'll get back to you soon.</p>
        {ticketNumber && (
          <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-4 mb-6">
            <p className="text-xs text-neutral-500 mb-1">Your Ticket Number</p>
            <p className="text-lg font-mono font-bold text-[#dfff00]">{ticketNumber}</p>
            <p className="text-xs text-neutral-500 mt-2">Save this for your reference</p>
          </div>
        )}
        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-neutral-400 text-sm">Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.</p>
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase">First Name *</label>
            <input 
              type="text" 
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none" 
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Last Name *</label>
            <input 
              type="text" 
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none" 
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Email *</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none" 
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Phone (Optional)</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-400 uppercase">Message *</label>
          <textarea 
            rows={4} 
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-white focus:border-[#dfff00] focus:outline-none resize-none"
            required
          ></textarea>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </span>
          ) : (
            'Send Message'
          )}
        </Button>
      </form>
    </div>
  );
};

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
            <ContactForm onClose={onClose} />
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