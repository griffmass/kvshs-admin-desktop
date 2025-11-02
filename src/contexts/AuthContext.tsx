import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

declare global {
  interface Window {
    process?: {
      type: string;
    };
    electronAPI: {
      loginAdmin: (email: string, password: string) => Promise<{ success: boolean; user?: { id: number; email: string }; error?: string }>;
      updateUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
      getUserByEmail: (email: string) => Promise<{ success: boolean; user?: { id: number; email: string }; error?: string }>;
      storeOtp: (userId: string, otp: string, expiresAt: string) => Promise<{ success: boolean; error?: string }>;
      verifyOtp: (userId: string, otp: string) => Promise<{ success: boolean; data?: { userId: number }; error?: string }>;
      generateResetToken: (userId: string) => Promise<{ success: boolean; token?: string; error?: string }>;
    };
  }
}

interface AdminUser {
  id: number;
  email: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (user: AdminUser, remember?: boolean) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for remembered login first (localStorage)
    const rememberedUser = localStorage.getItem('admin_user');
    const rememberLogin = localStorage.getItem('remember_login') === 'true';

    if (rememberedUser && rememberLogin) {
      try {
        const parsedUser = JSON.parse(rememberedUser);
        setUser(parsedUser);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing remembered user:', error);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('remember_login');
      }
    }

    // Check for session login (sessionStorage)
    const sessionUser = sessionStorage.getItem('admin_user');
    if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing session user:', error);
        sessionStorage.removeItem('admin_user');
      }
    }

    setLoading(false);
  }, []);

  const signIn = (userData: AdminUser, remember: boolean = false) => {
    setUser(userData);
    if (remember) {
      localStorage.setItem('admin_user', JSON.stringify(userData));
      localStorage.setItem('remember_login', 'true');
    } else {
      // Store in session storage for current session only
      sessionStorage.setItem('admin_user', JSON.stringify(userData));
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('remember_login');
    sessionStorage.removeItem('admin_user');
  };

  const refreshUser = () => {
    // Check for remembered login first (localStorage)
    const rememberedUser = localStorage.getItem('admin_user');
    const rememberLogin = localStorage.getItem('remember_login') === 'true';

    if (rememberedUser && rememberLogin) {
      try {
        const parsedUser = JSON.parse(rememberedUser);
        setUser(parsedUser);
        return;
      } catch (error) {
        console.error('Error parsing remembered user:', error);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('remember_login');
      }
    }

    // Check for session login (sessionStorage)
    const sessionUser = sessionStorage.getItem('admin_user');
    if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing session user:', error);
        sessionStorage.removeItem('admin_user');
      }
    }
  };

  const value = {
    user,
    loading,
    signOut,
    signIn,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}