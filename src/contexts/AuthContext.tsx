import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // Import GLOBAL client
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isRecovery: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GreckoUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  const mapProfileToUser = (profile: any, authUser: SupabaseUser): GreckoUser => {
    const isAdminEmail = authUser.email === 'lubegahatwib13@gmail.com' || authUser.email === 'lubegahatwib13@gamil.com';

    return {
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Student',
      email: authUser.email || '',
      avatar: profile?.avatar || authUser.user_metadata?.avatar_url,
      gpa: profile?.gpa || 0.0,
      school: profile?.school || '',
      bio: profile?.bio || '',
      academicLevel: profile?.academic_level || '',
      grade: profile?.grade || authUser.user_metadata?.grade || '',
      role: isAdminEmail ? 'admin' : (profile?.role || 'student')
    };
  };

  const fetchProfile = async (currentSession: Session) => {
    if (!currentSession?.user) {
        setLoading(false);
        return;
    }

    const authUser = currentSession.user;
    let profileData = null;
    let attempts = 0;
    const maxAttempts = 3; 

    try {
      // RETRY LOOP: Wait for Backend Trigger to create the profile
      // WE DO NOT INSERT HERE. WE ONLY READ.
      while (attempts < maxAttempts && !profileData) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (data) {
          profileData = data;
        } else {
          // If no profile yet, wait 500ms and try again
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // If profile exists, use it. If not, use Auth Metadata.
      // Do not error out, do not insert.
      setUser(mapProfileToUser(profileData || {}, authUser));

    } catch (err) {
      console.error("Auth Context Error:", err);
      // Fallback to basic user to prevent app crash
      setUser(mapProfileToUser({}, authUser));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        fetchProfile(session);
      } else {
        setLoading(false);
      }
    });

    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      
      setSession(newSession);

      if (newSession) {
        // Only fetch profile if user changed or previously missing
        if (!user || user.id !== newSession.user.id) {
            fetchProfile(newSession);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to prevent loop

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
    setIsRecovery(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isRecovery, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);