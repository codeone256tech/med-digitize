import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, doctorName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  doctorName: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch doctor profile
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('doctor_name')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (profile) {
              setDoctorName(profile.doctor_name);
            }
          }, 0);
        } else {
          setDoctorName(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check if user explicitly logged out
      const userLoggedOut = localStorage.getItem('user_logged_out');
      
      if (session?.user && !userLoggedOut) {
        setSession(session);
        setUser(session.user);
        fetchDoctorProfile(session.user.id);
      } else {
        // Clear session if user logged out
        if (userLoggedOut) {
          localStorage.removeItem('user_logged_out');
          supabase.auth.signOut({ scope: 'global' });
        }
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cleanupAuthState = () => {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, doctorName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            doctor_name: doctorName
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email for verification.",
      });

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const fetchDoctorProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('doctor_name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profile) {
        setDoctorName(profile.doctor_name);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      setSession(null);
      setDoctorName('');
      // Save the fact that user logged out to prevent auto-session restore
      localStorage.setItem('user_logged_out', 'true');
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigation even if signOut fails
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      doctorName
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};