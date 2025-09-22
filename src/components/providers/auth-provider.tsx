'use client';

import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { User, StoredUser, UserStatus } from '@/types';

export type AuthContextType = {
  user: User | null;
  users: StoredUser[];
  isLoading: boolean;
  login: (username: string, pass: string) => boolean;
  signup: (username:string, pass:string, phoneNumber:string | undefined, email: string) => boolean;
  logout: (router: AppRouterInstance) => void;
  addUserByAdmin: (username: string, pass: string, phoneNumber: string, email: string, role: 'admin' | 'user') => boolean;
  deleteUser: (userId: string) => void;
  updateUserRole: (userId: string, role: 'admin' | 'user') => void;
  toggleUserActiveStatus: (userId: string) => void;
  approveUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<Omit<StoredUser, 'id'>>) => boolean;
};

const USERS_STORAGE_KEY = 'iraqi_doctors_users_v3';
const LOGGED_IN_USER_KEY = 'iraqi_doctors_loggedin_user_v3';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const adminUser: StoredUser = {
  id: 'admin-user',
  username: 'HUNTER',
  pass: 'Ah5535670',
  phoneNumber: '07803080003',
  email: 'im.a.hunter.one@gmail.com',
  role: 'admin',
  status: 'active',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>(USERS_STORAGE_KEY, [adminUser]);
  const [loggedInUser, setLoggedInUser] = useLocalStorage<User | null>(LOGGED_IN_USER_KEY, null);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    if (loggedInUser) {
      const userFromStorage = storedUsers.find(u => u.id === loggedInUser.id);
      if (userFromStorage) {
        const sessionUser: User = {
          id: userFromStorage.id,
          username: userFromStorage.username,
          phoneNumber: userFromStorage.phoneNumber,
          email: userFromStorage.email,
          role: userFromStorage.role,
          status: userFromStorage.status || 'pending',
        };
        setUser(sessionUser);
        if (JSON.stringify(loggedInUser) !== JSON.stringify(sessionUser)) {
          setLoggedInUser(sessionUser);
        }
      } else {
        setLoggedInUser(null);
      }
    } else {
        if (!storedUsers.find(u => u.username === 'HUNTER')) {
             setStoredUsers(prev => [adminUser, ...prev.filter(u => u.username !== 'HUNTER')]);
        }
    }
    
    setIsLoading(false);
  }, []);
  
    useEffect(() => {
        if (user) {
            const currentUserInStorage = storedUsers.find(u => u.id === user.id);
            if (!currentUserInStorage || currentUserInStorage.status === 'banned') {
                setUser(null);
                setLoggedInUser(null);
            } else {
                const updatedSession: User = {
                    id: currentUserInStorage.id,
                    username: currentUserInStorage.username,
                    phoneNumber: currentUserInStorage.phoneNumber,
                    email: currentUserInStorage.email,
                    role: currentUserInStorage.role,
                    status: currentUserInStorage.status,
                };
                if (JSON.stringify(user) !== JSON.stringify(updatedSession)) {
                    setUser(updatedSession);
                    setLoggedInUser(updatedSession);
                }
            }
        }
    }, [storedUsers, user, setLoggedInUser]);


  const login = useCallback((username: string, pass: string): boolean => {
    const userToLogin = storedUsers.find(
      (u) => u.username === username && u.pass === pass
    );

    if (userToLogin) {
      if (userToLogin.status === 'banned') {
        // Explicitly handle banned case if needed, e.g. show a specific message
        // For now, we just prevent login.
        return false;
      }
      const sessionUser: User = {
        id: userToLogin.id,
        username: userToLogin.username,
        phoneNumber: userToLogin.phoneNumber,
        email: userToLogin.email,
        role: userToLogin.role,
        status: userToLogin.status,
      };
      setUser(sessionUser);
      setLoggedInUser(sessionUser);

      return true;
    }
    return false;
  }, [storedUsers, setLoggedInUser]);

  const signup = useCallback((username: string, pass: string, phoneNumber: string = '', email: string): boolean => {
    const userExists = storedUsers.some(u => 
        u.email === email || (phoneNumber && u.phoneNumber && u.phoneNumber === phoneNumber)
    );
    if (userExists) {
      return false; 
    }
    
    const newUser: StoredUser = { 
        id: new Date().toISOString(),
        username, 
        pass,
        phoneNumber,
        email,
        role: 'user',
        status: 'pending',
    };
    setStoredUsers(prev => [...prev, newUser]);
    return true;
  }, [storedUsers, setStoredUsers]);
  
  const addUserByAdmin = useCallback((username: string, pass: string, phoneNumber: string, email: string, role: 'admin' | 'user'): boolean => {
    const userExists = storedUsers.some(u => 
        u.email === email || (phoneNumber && u.phoneNumber && u.phoneNumber === phoneNumber)
    );
    if (userExists) {
      return false; 
    }
    
    const newUser: StoredUser = { 
        id: new Date().toISOString(),
        username, 
        pass,
        phoneNumber,
        email,
        role,
        status: 'active', // Users added by admin are active by default
    };
    setStoredUsers(prev => [...prev, newUser]);
    return true;
  }, [storedUsers, setStoredUsers]);
  
  const deleteUser = useCallback((userId: string) => {
    setStoredUsers(prev => prev.filter(u => u.id !== userId && u.username !== 'HUNTER'));
  }, [setStoredUsers]);

  const updateUserRole = useCallback((userId: string, role: 'admin' | 'user') => {
    setStoredUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }, [setStoredUsers]);

  const toggleUserActiveStatus = useCallback((userId: string) => {
    setStoredUsers(prev => prev.map(u => {
      if (u.id === userId) {
        // If user is active, set to pending. If pending or banned, set to active.
        const newStatus = u.status === 'active' ? 'pending' : 'active';
        return { ...u, status: newStatus };
      }
      return u;
    }));
  }, [setStoredUsers]);
  
  const approveUser = useCallback((userId: string) => {
    setStoredUsers(prev => prev.map(u => 
      u.id === userId && u.status === 'pending' ? { ...u, status: 'active' } : u
    ));
  }, [setStoredUsers]);

  const updateUser = useCallback((userId: string, updates: Partial<Omit<StoredUser, 'id'>>): boolean => {
    if (updates.email || (updates.phoneNumber && updates.phoneNumber.trim() !== '')) {
      const userExists = storedUsers.some(u => 
        u.id !== userId && (
          (updates.email && u.email === updates.email) || 
          (updates.phoneNumber && u.phoneNumber && u.phoneNumber === updates.phoneNumber)
        )
      );
      if (userExists) {
        return false;
      }
    }

    setStoredUsers(prev => 
      prev.map(u => (u.id === userId ? { ...u, ...updates } : u))
    );
    return true;
  }, [storedUsers, setStoredUsers]);


  const logout = useCallback((router: AppRouterInstance) => {
    setUser(null);
    setLoggedInUser(null);
    router.replace('/login');
  }, [setLoggedInUser]);
  
  const value = useMemo(() => ({
    user,
    users: storedUsers,
    isLoading,
    login,
    signup,
    logout,
    addUserByAdmin,
    deleteUser,
    updateUserRole,
    toggleUserActiveStatus,
    approveUser,
    updateUser,
  }), [user, storedUsers, isLoading, login, signup, logout, addUserByAdmin, deleteUser, updateUserRole, toggleUserActiveStatus, approveUser, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
