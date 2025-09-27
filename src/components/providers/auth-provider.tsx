'use client';

import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type User = {
  id: string;
  email?: string;
  role?: string; // We might manage roles in a separate table later
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ error: any }>;
  signup: (email:string, pass:string, options?: {data: {[key: string]: any}}) => Promise<{ error: any }>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userProfile: User = {
          id: session.user.id,
          email: session.user.email,
          role: 'user' // Default role for now
        };
        setUser(userProfile);
      }
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const userProfile: User = {
          id: session.user.id,
          email: session.user.email,
          role: 'user' // Default role
        };
        setUser(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  }, []);

  const signup = useCallback(async (email: string, pass: string, options?: {data: {[key: string]: any}}) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options
    });
    return { error };
  }, []);
  
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    signup,
    logout,
  }), [user, isLoading, login, signup, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
