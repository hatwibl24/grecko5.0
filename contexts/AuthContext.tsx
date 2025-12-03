
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as GreckoUser } from '../types';

interface AuthContextType {
  user: GreckoUser | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isRecovery: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isRecovery: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  refreshProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GreckoUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const fetchingRef = useRef(false); // Prevent double-fetching

  const mapProfileToUser = (profile: any, authUser: SupabaseUser): GreckoUser => {
    const isAdminEmail = authUser.email === 'lubegahatwib13@gmail.com';
    return {
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.full_name || 'Student',
      email: authUser.email || '',
      avatar: profile?.avatar || authUser.user_metadata?.avatar_url,
      gpa: profile?.gpa || 0.0,
      school: profile?.school || '',
      bio: profile?.bio || '',
      academicLevel: profile?.academic_level || '',
      grade: profile?.grade || '',
      role: isAdminEmail ? 'admin' : (profile?.role || 'student')
    };
  };

  const fetchProfile = async (currentUser: SupabaseUser) => {
    // If already fetching, skip unless force refresh is needed (we can relax this check for refreshProfile)
    // For now, we keep the ref check but ensure we clear it in finally block
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // 1. Attempt to fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        setUser(mapProfileToUser(data, currentUser));
      } else {
        // 2. If missing, check if it's a NEW user (created < 30 seconds ago)
        // If it's an old user, don't retry, just load defaults.
        const createdAgo = new Date().getTime() - new Date(currentUser.created_at).getTime();
        
        if (createdAgo < 30000) {
           // It's a new user, wait briefly for trigger
           await new Promise(r => setTimeout(r, 1000));
           const { data: retryData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
           setUser(mapProfileToUser(retryData || {}, currentUser));
        } else {
           // Old user with missing profile? Just load defaults.
           setUser(mapProfileToUser({}, currentUser));
        }
      }
    } catch (err) {
      console.error("Auth Load Error:", err);
      setUser(mapProfileToUser({}, currentUser));
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
        // Reset fetching ref to allow manual refresh
        fetchingRef.current = false; 
        await fetchProfile(session.user);
    }
  };

  useEffect(() => {
    // Initial Load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    // Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      setSession(newSession);
      
      if (newSession?.user) {
        // Only fetch if user ID changed to avoid loops
        setUser(prev => {
            if (prev?.id !== newSession.user.id) {
                fetchProfile(newSession.user);
            }
            return prev;
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isRecovery, signInWithGoogle, signOut, resetPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
