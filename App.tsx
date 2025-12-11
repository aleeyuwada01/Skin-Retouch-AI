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
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        const session = await supabaseService.getSession();
        if (!isMounted) return;
        
        if (session?.user) {
          try {
            const profile = await supabaseService.getProfile(session.user.id);
            if (isMounted) {
              setAuthState({ user: session.user, profile, isLoading: false });
            }
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            // User exists but profile fetch failed - still allow access
            if (isMounted) {
              setAuthState({ user: session.user, profile: null, isLoading: false });
            }
          }
        } else {
          if (isMounted) {
            setAuthState({ user: null, profile: null, isLoading: false });
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (isMounted) {
          setAuthState({ user: null, profile: null, isLoading: false });
        }
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted && authState.isLoading) {
        console.warn('Auth init timeout - forcing load complete');
        setAuthState({ user: null, profile: null, isLoading: false });
      }
    }, 5000);

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabaseService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const profile = await supabaseService.getProfile(session.user.id);
          if (isMounted) {
            setAuthState({ user: session.user, profile, isLoading: false });
          }
        } catch (error) {
          console.error('Profile fetch on sign in error:', error);
          if (isMounted) {
            setAuthState({ user: session.user, profile: null, isLoading: false });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setAuthState({ user: null, profile: null, isLoading: false });
          setView('landing');
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = async (user: User, redirectToApp: boolean = true) => {
    try {
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