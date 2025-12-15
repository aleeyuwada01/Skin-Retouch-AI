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

  // Clear storage on page load (temporary fix) - preserve rememberMe setting
  useEffect(() => {
    const rememberMeSetting = localStorage.getItem('rememberMe');
    
    // Clear all localStorage except rememberMe
    localStorage.clear();
    
    // Restore rememberMe setting
    if (rememberMeSetting !== null) {
      localStorage.setItem('rememberMe', rememberMeSetting);
    }
    
    // Clear Supabase session from storage
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Set loading to false immediately since we cleared the session
    setAuthState({ user: null, profile: null, isLoading: false });
  }, []);

  const handleLoginSuccess = async (user: User, redirectToApp: boolean = true) => {
    try {
      const profile = await supabaseService.getProfile(user.id);
      setAuthState({ user, profile, isLoading: false });
      
      // Sync remote history to local storage on login (Requirements: 4.2)
      // Handle sync errors gracefully - don't block login
      supabaseService.syncHistoryOnLogin(user.id).catch(error => {
        console.error('Failed to sync history on login:', error);
      });
      
      // Redirect admin users to admin panel, regular users to editor
      if (redirectToApp) {
        if (profile?.is_admin) {
          setView('admin');
        } else {
          setView('editor');
        }
      }
    } catch (error) {
      console.error('Error fetching profile on login:', error);
      // Still allow login even if profile fetch fails
      setAuthState({ user, profile: null, isLoading: false });
      if (redirectToApp) {
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