import { useState, useEffect, createContext, useContext } from 'react';
import { apiService, User } from '@/services/apiService';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  doctorName: string | null;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing user session
    const currentUser = apiService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setDoctorName(currentUser.name);
      setUserRole(currentUser.role);
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const response = await apiService.signIn(username, password);
      
      if (response.error) {
        return { error: response.error };
      }

      if (response.user) {
        setUser(response.user);
        setDoctorName(response.user.name);
        setUserRole(response.user.role);
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (name: string, username: string, password: string) => {
    try {
      const response = await apiService.signUp(name, username, password);
      
      if (response.error) {
        return { error: response.error };
      }

      toast({
        title: "Success",
        description: "Account created successfully! You can now log in.",
      });

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await apiService.signOut();
      setUser(null);
      setDoctorName(null);
      setUserRole(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      doctorName,
      userRole
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