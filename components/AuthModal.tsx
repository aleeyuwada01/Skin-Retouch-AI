import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { supabaseService } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView: 'login' | 'register';
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView, onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'register'>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setView(initialView);
    setError(null);
    setSuccessMessage(null);
    setName('');
    setEmail('');
    setPassword('');
  }, [initialView, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (view === 'register') {
        const data = await supabaseService.signUp(email, password, name);
        
        if (data.user && !data.session) {
          // Email confirmation required
          setSuccessMessage("Check your email to confirm your account!");
        } else if (data.user && data.session) {
          // Auto-confirmed (for development)
          await onLoginSuccess(data.user);
          onClose();
        }
      } else {
        // Save remember me preference
        localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
        
        // First check if there's an existing session
        const existingSession = await supabaseService.getSession();
        if (existingSession?.user) {
          // Session exists, use it directly
          await onLoginSuccess(existingSession.user);
          onClose();
          return;
        }
        
        const data = await supabaseService.signIn(email, password);
        if (data.user) {
          await onLoginSuccess(data.user);
          onClose();
        }
      }
    } catch (err: any) {
      const message = err.message || "An error occurred";
      // Make error messages more user-friendly
      if (message.includes("Invalid login credentials")) {
        setError("Invalid email or password.");
      } else if (message.includes("User already registered")) {
        setError("Account with this email already exists.");
      } else if (message.includes("Password should be")) {
        setError("Password must be at least 6 characters.");
      } else if (message.includes("already") || message.includes("session")) {
        // Session conflict - try to use existing session
        try {
          const session = await supabaseService.getSession();
          if (session?.user) {
            await onLoginSuccess(session.user);
            onClose();
            return;
          }
        } catch {
          // Ignore and show original error
        }
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {view === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-neutral-400 text-sm">
              {view === 'login' 
                ? 'Enter your credentials to access your workspace.' 
                : 'Join thousands of professional retouchers today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-[#dfff00] focus:outline-none transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-[#dfff00] focus:outline-none transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-[#dfff00] focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {view === 'login' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 bg-[#1a1a1a] text-[#dfff00] focus:ring-[#dfff00] focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-neutral-400 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/50 text-red-200 text-xs text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-green-900/20 border border-green-900/50 text-green-200 text-xs text-center">
                {successMessage}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full mt-6" 
              isLoading={isLoading}
            >
              {view === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              {view === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="text-[#dfff00] hover:underline font-medium"
              >
                {view === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};