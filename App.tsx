import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Editor } from './components/Editor';
import { AdminPanel } from './components/AdminPanel';
import { supabaseService, Profile } from './services/supabaseService';
import { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'editor' | 'admin'>('landing');
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true
  });

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await supabaseService.getSession();
        if (session?.user) {
          const profile = await supabaseService.getProfile(session.user.id);
          setAuthState({ user: session.user, profile, isLoading: false });
        } else {
          setAuthState({ user: null, profile: null, isLoading: false });
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setAuthState({ user: null, profile: null, isLoading: false });
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabaseService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await supabaseService.getProfile(session.user.id);
        setAuthState({ user: session.user, profile, isLoading: false });
      } else if (event === 'SIGNED_OUT') {
        setAuthState({ user: null, profile: null, isLoading: false });
        setView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = async (user: User, redirectToApp: boolean = true) => {
    const profile = await supabaseService.getProfile(user.id);
    setAuthState({ user, profile, isLoading: false });
    
    // Redirect admin users to admin panel, regular users to editor
    if (redirectToApp) {
      if (profile?.is_admin) {
        setView('admin');
      } else {
        setView('editor');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await supabaseService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Always clear state even if signOut fails
    setAuthState({ user: null, profile: null, isLoading: false });
    setView('landing');
  };

  const refreshProfile = async () => {
    if (authState.user) {
      const profile = await supabaseService.getProfile(authState.user.id);
      setAuthState(prev => ({ ...prev, profile }));
    }
  };

  // Show loading state
  if (authState.isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#dfff00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      {view === 'landing' && (
        <LandingPage 
          onStart={() => setView('editor')} 
          authState={authState}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onAdminClick={() => setView('admin')}
        />
      )}
      {view === 'editor' && (
        <Editor 
          onBack={() => setView('landing')} 
          authState={authState}
          onRefreshProfile={refreshProfile}
        />
      )}
      {view === 'admin' && authState.profile?.is_admin && (
        <AdminPanel onBack={() => setView('landing')} />
      )}
    </>
  );
};

export default App;