'use client';

import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { User, StoredUser } from '@/types';
import { useRouter } from 'next/navigation';


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
  toggleUserActiveStatus: (userId: string) => void;
  approveUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<Omit<StoredUser, 'id'>>) => boolean;
  isApprovalSystemEnabled: boolean;
  toggleApprovalSystem: () => void;
};

const USERS_STORAGE_KEY = 'iraqi_doctors_users_v3';
const LOGGED_IN_USER_KEY = 'iraqi_doctors_loggedin_user_v3';
const APPROVAL_SYSTEM_KEY = 'iraqi_doctors_approval_system_enabled_v1';

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
  const [isApprovalSystemEnabled, setIsApprovalSystemEnabled] = useLocalStorage<boolean>(APPROVAL_SYSTEM_KEY, false);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    setIsLoading(true);
    if (loggedInUser) {
      // Find the user's latest data from the full user list
      const userFromStorage = storedUsers.find(u => u.id === loggedInUser.id);
      if (userFromStorage) {
         setUser({
            id: userFromStorage.id,
            username: userFromStorage.username,
            phoneNumber: userFromStorage.phoneNumber,
            email: userFromStorage.email,
            role: userFromStorage.role,
            status: userFromStorage.status,
          });
      } else {
        // If the logged-in user is not in the user list, they've been deleted.
        setUser(null);
        setLoggedInUser(null);
      }
    } else {
        setUser(null);
         if (!storedUsers.find(u => u.username === 'HUNTER')) {
           setStoredUsers(prev => [adminUser, ...prev.filter(u => u.username !== 'HUNTER')]);
      }
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser, storedUsers]);
  

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
        status: userToLogin.status,
      };
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
        status: isApprovalSystemEnabled ? 'pending' : 'active',
    };
    setStoredUsers(prev => [...prev, newUser]);
    return true;
  }, [storedUsers, setStoredUsers, isApprovalSystemEnabled]);
  
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
    setStoredUsers(prev => {
        const newUsers = prev.map(u => {
            if (u.id === userId) {
                // If user is active, set to banned. If pending or banned, set to active.
                const newStatus = u.status === 'active' ? 'banned' : 'active';
                return { ...u, status: newStatus };
            }
            return u;
        });
        return newUsers;
    });
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


  const logout = useCallback(() => {
    setUser(null);
    setLoggedInUser(null);
  }, [setLoggedInUser]);

  const toggleApprovalSystem = useCallback(() => {
    setIsApprovalSystemEnabled(prev => !prev);
  }, [setIsApprovalSystemEnabled]);
  
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
    isApprovalSystemEnabled,
    toggleApprovalSystem,
  }), [user, storedUsers, isLoading, login, signup, logout, addUserByAdmin, deleteUser, updateUserRole, toggleUserActiveStatus, approveUser, updateUser, isApprovalSystemEnabled, toggleApprovalSystem]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
