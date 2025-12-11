import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, Star, LogOut, User, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from './Button';
import { AuthModal } from './AuthModal';
import { PolicyModal, PolicyType } from './PolicyModal';
import { ComparisonSlider } from './ComparisonSlider';
import { AuthState } from '../App';

interface LandingPageProps {
  onStart: () => void;
  authState: AuthState;
  onLoginSuccess: (user: any) => void;
  onLogout: () => void;
  onAdminClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onStart, 
  authState, 
  onLoginSuccess, 
  onLogout,
  onAdminClick 
}) => {
  const [authModal, setAuthModal] = useState<{isOpen: boolean; view: 'login' | 'register'}>({
    isOpen: false,
    view: 'login'
  });

  // Policy Modal State
  const [policyModal, setPolicyModal] = useState<{isOpen: boolean; type: PolicyType}>({
    isOpen: false,
    type: null
  });

  const user = authState.user;
  const profile = authState.profile;

  const handleLoginSuccess = (user: any) => {
    onLoginSuccess(user);
    // App.tsx handles redirect based on admin status
  };

  const handleStartAction = () => {
    if (user) {
      onStart();
    } else {
      setAuthModal({ isOpen: true, view: 'register' });
    }
  };

  const openAuth = (view: 'login' | 'register') => {
    setAuthModal({ isOpen: true, view });
  };

  const openPolicy = (type: PolicyType) => {
    setPolicyModal({ isOpen: true, type });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#dfff00] selection:text-black">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="text-[#dfff00]" size={24} />
            <span>Skin Retoucher AI</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
             {user ? (
               <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-2 text-sm font-medium text-neutral-300">
                   <User size={16} />
                   <span>Hi, {profile?.full_name || user.email?.split('@')[0]}</span>
                   {profile && (
                     <span className="text-xs bg-[#dfff00]/20 text-[#dfff00] px-2 py-0.5 rounded-full">
                       {profile.credits} credits
                     </span>
                   )}
                 </div>
                 {profile?.is_admin && (
                   <button 
                     onClick={onAdminClick}
                     className="hidden md:flex text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 px-3 py-2 rounded-full transition-colors items-center gap-2"
                   >
                     <Shield size={14} />
                     <span>Admin</span>
                   </button>
                 )}
                 <button 
                   onClick={onStart}
                   className="hidden md:flex text-sm font-bold bg-[#dfff00] text-black hover:bg-[#ccff00] px-4 py-2 rounded-full transition-colors items-center gap-2"
                 >
                   <LayoutDashboard size={16} />
                   <span>Dashboard</span>
                 </button>
                 <button 
                   onClick={onLogout}
                   className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
                 >
                   <LogOut size={16} />
                   <span className="hidden md:inline">Sign Out</span>
                 </button>
               </div>
             ) : (
               <>
                 <button 
                   onClick={() => openAuth('login')}
                   className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                 >
                   Sign In
                 </button>
                 <button 
                   onClick={() => openAuth('register')}
                   className="text-sm font-medium bg-white text-black hover:bg-neutral-200 px-5 py-2 rounded-full transition-colors font-semibold"
                 >
                   Register
                 </button>
               </>
             )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#dfff00]/5 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfff00]/10 text-[#dfff00] text-xs font-bold uppercase tracking-wider border border-[#dfff00]/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Star size={12} className="fill-current" />
            ✨ Next-Gen AI Model Active
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent pb-2 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both delay-100">
            Professional Skin<br />Retouching in Seconds.
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-200">
            AI-powered frequency separation and dodge & burn workflows. 
            Achieve magazine-quality results without the manual labor.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both delay-300">
            <Button onClick={handleStartAction} className="h-14 px-8 text-lg w-full sm:w-auto shadow-[0_0_30px_rgba(223,255,0,0.2)]">
              {user ? 'Go to Dashboard' : 'Start Retouching'} <ArrowRight size={18} />
            </Button>
            <button className="h-14 px-8 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              View Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Feature Visual */}
      <div className="px-6 pb-24">
         <div className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#111] p-2 relative shadow-2xl h-[500px] md:h-[600px]">
            <ComparisonSlider 
              original="https://i.ibb.co/xqJTYgDZ/before.png"
              processed="https://i.ibb.co/rKZBymJB/after.png"
              className="w-full h-full rounded-xl"
            />
         </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 px-6 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-neutral-400">Professional tools for everyone. Choose the plan that fits your workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {/* Free */}
            <div className="p-8 rounded-3xl border border-white/5 bg-[#111] hover:border-white/10 transition-colors">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="text-3xl font-bold mb-6">Free <span className="text-sm text-neutral-500 font-normal">/ forever</span></div>
              <ul className="space-y-4 mb-8">
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> 5 Retouches / day</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> Standard Quality</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> All Pro Styles</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> Web Resolution</li>
              </ul>
              <Button onClick={handleStartAction} variant="secondary" className="w-full">Try Now</Button>
            </div>

            {/* Pro - Coming Soon */}
            <div className="relative p-8 rounded-3xl border border-[#dfff00]/30 bg-[#161616] overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.5)] transform hover:-translate-y-1 transition-transform duration-300">
               <div className="absolute top-0 right-0 bg-[#dfff00] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-xl">Coming Soon</div>
              <h3 className="text-xl font-bold mb-2 text-[#dfff00]">Pro</h3>
              <div className="text-3xl font-bold mb-6">Coming Soon</div>
              <ul className="space-y-4 mb-8">
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> Unlimited Retouches</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> 4K Ultra-HD Download</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> All 5 Pro Styles</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> Priority Processing</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> Batch Editing</li>
              </ul>
              <button disabled className="w-full py-3.5 rounded-xl font-bold bg-[#dfff00] text-black opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
                 Join Waitlist
              </button>
            </div>

             {/* Studio - Coming Soon */}
            <div className="relative p-8 rounded-3xl border border-white/5 bg-[#111] opacity-60 hover:opacity-100 transition-opacity duration-300">
               <div className="absolute top-0 right-0 bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-bl-xl">Enterprise</div>
              <h3 className="text-xl font-bold mb-2">Studio</h3>
              <div className="text-3xl font-bold mb-6">Custom</div>
              <ul className="space-y-4 mb-8">
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> API Access</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> Team Seats (5+)</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> Custom Model Fine-tuning</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> Dedicated Support</li>
              </ul>
               <button disabled className="w-full py-3.5 rounded-xl font-medium bg-white/5 text-neutral-400 border border-white/10 cursor-not-allowed">Contact Sales</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#050505] text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
           <div className="flex items-center gap-2 font-bold text-lg text-neutral-500">
            <Sparkles size={18} />
            <span>Skin Retoucher AI</span>
          </div>
           <div className="flex gap-6 text-sm text-neutral-400">
             <button onClick={() => openPolicy('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
             <button onClick={() => openPolicy('terms')} className="hover:text-white transition-colors">Terms of Service</button>
             <button onClick={() => openPolicy('contact')} className="hover:text-white transition-colors">Contact</button>
           </div>
           <p className="text-xs text-neutral-700">&copy; 2025 Skin Retoucher AI. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        initialView={authModal.view}
        onLoginSuccess={handleLoginSuccess}
      />

      <PolicyModal 
        isOpen={policyModal.isOpen} 
        onClose={() => setPolicyModal({ ...policyModal, isOpen: false })}
        type={policyModal.type}
      />
    </div>
  );
};