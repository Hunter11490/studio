'use client';

import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { User, StoredUser } from '@/types';

// In a real offline-first app, this might involve more complex client-side hashing
// For this prototype, we'll keep it simple.

export type AuthContextType = {
  user: User | null;
  users: StoredUser[];
  isLoading: boolean;
  login: (username: string, pass: string) => boolean;
  signup: (username:string, pass:string, phoneNumber:string | undefined, email: string) => boolean;
  logout: () => void;
  addUserByAdmin: (username: string, pass: string, phoneNumber: string, email: string, role: 'admin' | 'user') => boolean;
  deleteUser: (userId: string) => void;
  updateUserRole: (userId: string, role: 'admin' | 'user') => void;
  updateUser: (userId: string, updates: Partial<Omit<StoredUser, 'id'>>) => boolean;
};

const USERS_STORAGE_KEY = 'iraqi_doctors_users_v2';
const LOGGED_IN_USER_KEY = 'iraqi_doctors_loggedin_user_v2';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>(USERS_STORAGE_KEY, []);
  const [loggedInUser, setLoggedInUser] = useLocalStorage<User | null>(LOGGED_IN_USER_KEY, null);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    // Initialize admin user if not present
    setStoredUsers(prevUsers => {
        const adminExists = prevUsers.some(u => u.username === 'HUNTER');
        if (!adminExists) {
            const adminUser: StoredUser = {
                id: 'admin-user',
                username: 'HUNTER',
                pass: 'Ah5535670',
                phoneNumber: '07803080003',
                email: 'im.a.hunter.one@gmail.com',
                role: 'admin',
            };
            return [adminUser, ...prevUsers.filter(u => u.id !== 'admin-user')];
        }
        // Also ensure admin role is correct if user already exists
        return prevUsers.map(u => u.username === 'HUNTER' ? { ...u, role: 'admin', pass: 'Ah5535670', phoneNumber: '07803080003', email: 'im.a.hunter.one@gmail.com' } : u);
    });

    // On initial load, check if there's a logged-in user session
    if (loggedInUser) {
      // Re-verify user from the potentially updated storedUsers
      const userFromStorage = storedUsers.find(u => u.id === loggedInUser.id);
      if (userFromStorage) {
        // Ensure the session user has the correct role from storage
        const sessionUser: User = {
          id: userFromStorage.id,
          username: userFromStorage.username,
          phoneNumber: userFromStorage.phoneNumber,
          email: userFromStorage.email,
          role: userFromStorage.role,
        };
        setUser(sessionUser);
        // Update session storage if role was incorrect
        if (loggedInUser.role !== sessionUser.role) {
          setLoggedInUser(sessionUser);
        }
      } else {
        setLoggedInUser(null); // Clear invalid session
      }
    }
    
    setIsLoading(false);
  }, []); // Run only once on mount
  
    useEffect(() => {
        // This effect ensures that any change in storedUsers (e.g. by admin)
        // is reflected in the currently logged-in user's state.
        if (user) {
            const currentUserInStorage = storedUsers.find(u => u.id === user.id);
            if (!currentUserInStorage) {
                // User was deleted, log them out.
                logout();
            } else if (currentUserInStorage.role !== user.role) {
                // User role was changed, update session.
                const updatedSession: User = {
                    id: currentUserInStorage.id,
                    username: currentUserInStorage.username,
                    phoneNumber: currentUserInStorage.phoneNumber,
                    email: currentUserInStorage.email,
                    role: currentUserInStorage.role,
                };
                setUser(updatedSession);
                setLoggedInUser(updatedSession);
            }
        }
    }, [storedUsers, user, setLoggedInUser]);


  const login = useCallback((username: string, pass: string): boolean => {
    const userToLogin = storedUsers.find(
      (u) => u.username === username && u.pass === pass
    );

    if (userToLogin) {
      const sessionUser: User = {
        id: userToLogin.id,
        username: userToLogin.username,
        phoneNumber: userToLogin.phoneNumber,
        email: userToLogin.email,
        role: userToLogin.role,
      };
      setUser(sessionUser);
      setLoggedInUser(sessionUser);
      return true;
    }
    return false;
  }, [storedUsers, setLoggedInUser]);

  const signup = useCallback((username: string, pass: string, phoneNumber: string = '', email: string): boolean => {
    const userExists = storedUsers.some(u => u.username === username || u.email === email);
    if (userExists) {
      return false; 
    }
    
    const newUser: StoredUser = { 
        id: new Date().toISOString(),
        username, 
        pass, // Storing password directly for simplicity.
        phoneNumber,
        email,
        role: 'user'
    };
    setStoredUsers(prev => [...prev, newUser]);
    return true;
  }, [storedUsers, setStoredUsers]);
  
  const addUserByAdmin = useCallback((username: string, pass: string, phoneNumber: string, email: string, role: 'admin' | 'user'): boolean => {
    const userExists = storedUsers.some(u => u.username === username || u.email === email);
    if (userExists) {
      return false; 
    }
    
    const newUser: StoredUser = { 
        id: new Date().toISOString(),
        username, 
        pass,
        phoneNumber,
        email,
        role
    };
    setStoredUsers(prev => [...prev, newUser]);
    return true;
  }, [storedUsers, setStoredUsers]);
  
  const deleteUser = useCallback((userId: string) => {
    setStoredUsers(prev => prev.filter(u => u.id !== userId));
  }, [setStoredUsers]);

  const updateUserRole = useCallback((userId: string, role: 'admin' | 'user') => {
    setStoredUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }, [setStoredUsers]);
  
  const updateUser = useCallback((userId: string, updates: Partial<Omit<StoredUser, 'id'>>): boolean => {
    // Check if new username or email already exists for another user
    if (updates.username || updates.email) {
      const userExists = storedUsers.some(u => 
        u.id !== userId && (
          (updates.username && u.username === updates.username) || 
          (updates.email && u.email === updates.email)
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


  const logout = useCallback(() => {
    setUser(null);
    setLoggedInUser(null);
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
    updateUser,
  }), [user, storedUsers, isLoading, login, signup, logout, addUserByAdmin, deleteUser, updateUserRole, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
