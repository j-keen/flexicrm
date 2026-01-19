import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getCurrentUserProfile, getUserPermissions } from '../services/supabase';
import type { UserProfile, PermissionId } from '../types';

// ============================================================================
// Auth Context Types
// ============================================================================

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permissionId: PermissionId | string) => boolean;
  isRole: (role: 'ceo' | 'team_lead' | 'staff') => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile and permissions
  const loadUserData = async (userId: string) => {
    try {
      console.log('[Auth] Fetching profile for userId:', userId);
      const userProfile = await getCurrentUserProfile(userId);
      console.log('[Auth] Profile result:', userProfile);
      setProfile(userProfile);

      if (userProfile) {
        console.log('[Auth] Fetching permissions...');
        const userPermissions = await getUserPermissions(userId);
        console.log('[Auth] Permissions:', userPermissions);
        setPermissions(userPermissions);
      }
    } catch (err) {
      console.error('[Auth] Error loading user data:', err);
      setError('Failed to load user data');
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        console.log('[Auth] Getting session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth] Session error:', error);
          setLoading(false);
          return;
        }

        console.log('[Auth] Session:', session ? 'exists' : 'null');
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[Auth] Loading user data for:', session.user.id);
          await loadUserData(session.user.id);
          console.log('[Auth] User data loaded');
        }

        setLoading(false);
        console.log('[Auth] Init complete, loading = false');
      } catch (err) {
        console.error('[Auth] Init error:', err);
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes (but skip initial events since we already handled it)
    let hasInitialized = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange event:', event, 'hasInitialized:', hasInitialized);

        // Skip INITIAL_SESSION and first SIGNED_IN - we already handled it in initSession
        if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && !hasInitialized)) {
          hasInitialized = true;
          console.log('[Auth] Skipping initial auth event:', event);
          return;
        }

        hasInitialized = true;

        // Only process actual user actions (sign in, sign out, token refresh)
        console.log('[Auth] Processing auth state change:', event);

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setLoading(true);
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserData(session.user.id);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setPermissions([]);
          setError(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in handler
  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return { error: signInError.message };
    }

    // Don't set loading to false here; let onAuthStateChange do it after loading profile
    return { error: null };
  };

  // Sign out handler
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPermissions([]);
    setLoading(false);
  };

  // Check if user has a specific permission
  const hasPermission = (permissionId: PermissionId | string): boolean => {
    return permissions.includes(permissionId);
  };

  // Check if user has a specific role
  const isRole = (role: 'ceo' | 'team_lead' | 'staff'): boolean => {
    return profile?.role === role;
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    permissions,
    loading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    hasPermission,
    isRole,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// Hook to use Auth Context
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
