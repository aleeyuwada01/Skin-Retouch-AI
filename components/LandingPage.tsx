import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, Star, LogOut, User, LayoutDashboard, Shield, Loader2, X, Phone, DollarSign, Settings, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { AuthModal } from './AuthModal';
import { PolicyModal, PolicyType } from './PolicyModal';
import { ComparisonSlider } from './ComparisonSlider';
import { AuthState } from '../App';
import { supabaseService, AppSettings } from '../services/supabaseService';
import { resetTourCount } from '../constants';

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

  // Purchase Modal State
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ name: '', phone: '', plan: 'starter' });
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Pricing State
  const [showNaira, setShowNaira] = useState(false);
  const [pricing, setPricing] = useState({ priceUsd: 7, credits: 30, rate: 1480 });

  // Settings Dropdown State
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [tourResetMessage, setTourResetMessage] = useState<string | null>(null);

  const user = authState.user;
  const profile = authState.profile;

  // Fetch pricing settings
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const settings = await supabaseService.getAppSettings();
        setPricing({
          priceUsd: settings.starter_price_usd,
          credits: settings.starter_credits,
          rate: settings.usd_to_ngn_rate
        });
      } catch (error) {
        console.error('Failed to load pricing:', error);
      }
    };
    loadPricing();
  }, []);

  const priceNaira = pricing.priceUsd * pricing.rate;
  const formattedPriceUsd = `$${pricing.priceUsd}`;
  const formattedPriceNaira = `₦${priceNaira.toLocaleString()}`;

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

  const handlePurchaseSubmit = async () => {
    if (!purchaseForm.name.trim() || !purchaseForm.phone.trim()) return;
    
    setIsSubmittingPurchase(true);
    try {
      await supabaseService.submitPurchaseRequest({
        name: purchaseForm.name,
        phone: purchaseForm.phone,
        plan: purchaseForm.plan,
        email: user?.email || undefined
      });
      setPurchaseSuccess(true);
    } catch (error) {
      console.error('Failed to submit purchase request:', error);
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const closePurchaseModal = () => {
    setPurchaseModal(false);
    setPurchaseSuccess(false);
    setPurchaseForm({ name: '', phone: '', plan: 'starter' });
  };

  // Handle tour reset (Requirements: 2.5)
  const handleResetTour = () => {
    resetTourCount();
    setTourResetMessage('Tour has been reset! You will see it on your next visit to the editor.');
    setShowSettingsMenu(false);
    // Auto-hide message after 3 seconds
    setTimeout(() => setTourResetMessage(null), 3000);
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
                 
                 {/* Settings Dropdown */}
                 <div className="relative">
                   <button 
                     onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                     className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-white/5"
                   >
                     <Settings size={16} />
                   </button>
                   
                   {showSettingsMenu && (
                     <>
                       {/* Backdrop to close menu */}
                       <div 
                         className="fixed inset-0 z-40" 
                         onClick={() => setShowSettingsMenu(false)}
                       />
                       {/* Dropdown Menu */}
                       <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                         <button
                           onClick={handleResetTour}
                           className="w-full px-4 py-3 text-left text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
                         >
                           <RotateCcw size={14} />
                           Reset Tour
                         </button>
                         <div className="border-t border-white/5" />
                         <button
                           onClick={() => {
                             setShowSettingsMenu(false);
                             onLogout();
                           }}
                           className="w-full px-4 py-3 text-left text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
                         >
                           <LogOut size={14} />
                           Sign Out
                         </button>
                       </div>
                     </>
                   )}
                 </div>
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
            <p className="text-neutral-400 mb-6">Professional tools for everyone. Choose the plan that fits your workflow.</p>
            
            {/* Currency Toggle */}
            <div className="inline-flex items-center gap-2 bg-[#1a1a1a] rounded-full p-1">
              <button
                onClick={() => setShowNaira(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  !showNaira ? 'bg-[#dfff00] text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <DollarSign size={14} />
                USD
              </button>
              <button
                onClick={() => setShowNaira(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  showNaira ? 'bg-[#dfff00] text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                ₦ NGN
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {/* Starter */}
            <div className="relative p-8 rounded-3xl border border-[#dfff00]/30 bg-[#161616] overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.5)] transform hover:-translate-y-1 transition-transform duration-300">
               <div className="absolute top-0 right-0 bg-[#dfff00] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-xl">Popular</div>
              <h3 className="text-xl font-bold mb-2 text-[#dfff00]">Starter</h3>
              <div className="text-3xl font-bold mb-1">{showNaira ? formattedPriceNaira : formattedPriceUsd}</div>
              <div className="text-sm text-neutral-400 mb-6">{pricing.credits} credits</div>
              <ul className="space-y-4 mb-8">
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> {pricing.credits} Retouches</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> All Pro Styles</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> 4K Ultra-HD Download</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-[#dfff00]" /> Background Change</li>
              </ul>
              <Button onClick={() => setPurchaseModal(true)} className="w-full">Buy Now</Button>
            </div>

            {/* Pro - Coming Soon */}
            <div className="relative p-8 rounded-3xl border border-white/5 bg-[#111] hover:border-white/10 transition-colors">
               <div className="absolute top-0 right-0 bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-bl-xl">Coming Soon</div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-6">Coming Soon</div>
              <ul className="space-y-4 mb-8">
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> Unlimited Retouches</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> 4K Ultra-HD Download</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> All Pro Styles</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> Priority Processing</li>
                 <li className="flex gap-3 text-sm text-neutral-300"><Check size={16} className="text-neutral-500" /> Batch Editing</li>
              </ul>
              <button onClick={() => setPurchaseModal(true)} className="w-full py-3.5 rounded-xl font-medium bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 transition-colors">
                 Join Waitlist
              </button>
            </div>

             {/* Studio - Enterprise */}
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
           {/* AI Disclaimer */}
           <p className="text-xs text-neutral-500 max-w-lg leading-relaxed">
             This service uses AI technology which may occasionally produce unexpected results. 
             We're continuously working to improve accuracy and quality. Results are not guaranteed 
             and should be reviewed before use.
           </p>
           <p className="text-xs text-neutral-700">&copy; 2025 Skin Retoucher AI. All rights reserved.</p>
        </div>
      </footer>

      {/* Tour Reset Confirmation Toast */}
      {tourResetMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] border border-[#dfff00]/30 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Check size={18} className="text-[#dfff00]" />
          <span className="text-sm">{tourResetMessage}</span>
          <button 
            onClick={() => setTourResetMessage(null)}
            className="text-neutral-400 hover:text-white ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

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

      {/* Purchase Modal */}
      {purchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={closePurchaseModal}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {purchaseSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Request Submitted!</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  We'll contact you shortly on the phone number provided to complete your purchase.
                </p>
                <Button onClick={closePurchaseModal} className="w-full">Done</Button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">Purchase Credits</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  Fill in your details and we'll contact you to complete the purchase.
                </p>

                <div className="space-y-4">
                  {/* Plan Selection */}
                  <div>
                    <label className="text-xs text-neutral-400 uppercase mb-2 block">Select Plan</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPurchaseForm(prev => ({ ...prev, plan: 'starter' }))}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          purchaseForm.plan === 'starter' 
                            ? 'border-[#dfff00] bg-[#dfff00]/10' 
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-sm">Starter</div>
                        <div className="text-[#dfff00] font-bold">{showNaira ? formattedPriceNaira : formattedPriceUsd}</div>
                        <div className="text-xs text-neutral-400">{pricing.credits} credits</div>
                      </button>
                      <button
                        onClick={() => setPurchaseForm(prev => ({ ...prev, plan: 'pro' }))}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          purchaseForm.plan === 'pro' 
                            ? 'border-[#dfff00] bg-[#dfff00]/10' 
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-sm">Pro Waitlist</div>
                        <div className="text-neutral-400 font-bold text-sm">Coming Soon</div>
                        <div className="text-xs text-neutral-400">Unlimited</div>
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-xs text-neutral-400 uppercase mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={purchaseForm.name}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your name"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#dfff00]"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs text-neutral-400 uppercase mb-1 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="tel"
                        value={purchaseForm.phone}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g., 08012345678"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#dfff00]"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handlePurchaseSubmit}
                  disabled={isSubmittingPurchase || !purchaseForm.name.trim() || !purchaseForm.phone.trim()}
                  className="w-full mt-6"
                >
                  {isSubmittingPurchase ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};