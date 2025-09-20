'use client';

import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

// In a real offline-first app, this might involve more complex client-side hashing
// For this prototype, we'll keep it simple.

type User = {
  username: string;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, pass: string) => boolean;
  signup: (username: string, pass: string) => boolean;
  logout: () => void;
};

const USER_STORAGE_KEY = 'iraqi_doctors_user';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storedUser, setStoredUser] = useLocalStorage<any | null>(USER_STORAGE_KEY, null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect simulates checking the stored user data on mount
    try {
        if (storedUser && storedUser.username) {
            setUser({ username: storedUser.username });
        }
    } catch (e) {
        console.error("Failed to parse user from storage", e);
        setStoredUser(null);
    } finally {
        setIsLoading(false);
    }
  }, [storedUser]);

  const login = useCallback((username: string, pass: string): boolean => {
    if (storedUser && storedUser.username === username && storedUser.pass === pass) {
      const loggedInUser = { username };
      setUser(loggedInUser);
      return true;
    }
    return false;
  }, [storedUser]);

  const signup = useCallback((username: string, pass: string): boolean => {
    // This simple offline auth only allows one user.
    if (storedUser) {
      return false; 
    }
    const newUser = { username, pass }; // Storing password directly for simplicity.
    setStoredUser(newUser);
    return true;
  }, [storedUser, setStoredUser]);

  const logout = useCallback(() => {
    setUser(null);
    // Note: We are not clearing the localStorage here so the user can log back in
    // without signing up again. To fully "sign out" and remove the user,
    // you would call setStoredUser(null).
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
