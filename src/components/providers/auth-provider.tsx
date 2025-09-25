'use client';

import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { User, StoredUser } from '@/types';
import { useRouter } from 'next/navigation';


export type AuthContextType = {
  user: User | null;
  users: StoredUser[];
  isLoading: boolean;
  sessionExpiresAt: number | null;
  passTimestamp: number;
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
  checkAndDeactivateUsers: () => void;
  checkAhmedSession: () => void;
};

const USERS_STORAGE_KEY = 'iraqi_doctors_users_v3';
const LOGGED_IN_USER_KEY = 'iraqi_doctors_loggedin_user_v3';
const APPROVAL_SYSTEM_KEY = 'iraqi_doctors_approval_system_enabled_v1';
const DYNAMIC_ADMIN_PASS_KEY = 'iraqi_doctors_dynamic_admin_pass_v1';
const PASS_TIMESTAMP_KEY = 'iraqi_doctors_pass_timestamp_v1';

const PASSWORD_LIFESPAN_MS = 24 * 60 * 60 * 1000;
const USER_EXPIRY_DURATION_MS = 33 * 24 * 60 * 60 * 1000;

const generateDeterministicPassword = (seedOffset: number) => {
    const now = Date.now();
    const timeSlot = Math.floor(now / PASSWORD_LIFESPAN_MS) + seedOffset;
    
    let seed = timeSlot;

    const pseudoRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
        password += charset.charAt(Math.floor(pseudoRandom() * charset.length));
    }
    return password;
};

const staticAdminUser: StoredUser = {
  id: 'admin-user-hunter',
  username: 'HUNTER',
  pass: 'Ah5535670',
  phoneNumber: '07803080003',
  email: 'im.a.hunter.one@gmail.com',
  role: 'admin',
  status: 'active',
  isFirstLogin: false,
};

const dynamicAdminUserTemplate: Omit<StoredUser, 'pass'> = {
  id: 'admin-user-ahmed',
  username: 'Ahmed',
  phoneNumber: '07803080003',
  email: 'im.a.hunter.one@gmail.com',
  role: 'admin',
  status: 'active',
  isFirstLogin: false,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>(USERS_STORAGE_KEY, [staticAdminUser]);
  const [loggedInUser, setLoggedInUser] = useLocalStorage<User | null>(LOGGED_IN_USER_KEY, null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [isApprovalSystemEnabled, setIsApprovalSystemEnabled] = useLocalStorage<boolean>(APPROVAL_SYSTEM_KEY, true);
  
  const [passTimestamp, setPassTimestamp] = useLocalStorage<number>(PASS_TIMESTAMP_KEY, 0);
  const [dynamicAdminPass, setDynamicAdminPass] = useLocalStorage<string>(DYNAMIC_ADMIN_PASS_KEY, '');

  
  const logout = useCallback(() => {
    setUser(null);
    setLoggedInUser(null);
    setSessionExpiresAt(null);
  }, [setLoggedInUser]);
  
  const checkAhmedSession = useCallback(() => {
    const currentTimestamp = Date.now();
    const startOfInterval = Math.floor(currentTimestamp / PASSWORD_LIFESPAN_MS) * PASSWORD_LIFESPAN_MS;
    const expiration = passTimestamp + PASSWORD_LIFESPAN_MS;

    // Check if the password needs to be rotated
    if (startOfInterval !== passTimestamp) {
        const newPass = generateDeterministicPassword(0);
        setDynamicAdminPass(newPass);
        setPassTimestamp(startOfInterval);
    }

    // Check if the current session belongs to Ahmed and has expired.
    if (loggedInUser?.username === 'Ahmed' && currentTimestamp > expiration) {
        logout();
    }
  }, [passTimestamp, setDynamicAdminPass, setPassTimestamp, loggedInUser, logout]);

  useEffect(() => {
    checkAhmedSession(); // Initial check
    const interval = setInterval(checkAhmedSession, 1000 * 60); // Check every minute
    return () => clearInterval(interval);
  }, [checkAhmedSession]);
  
  const allUsers = useMemo(() => {
    const dynamicAdmin: StoredUser = {
      ...dynamicAdminUserTemplate,
      pass: dynamicAdminPass || generateDeterministicPassword(0), // Fallback for initial load
    };

    const otherUsers = storedUsers.filter(u => u.id !== staticAdminUser.id && u.id !== dynamicAdminUserTemplate.id);
    return [staticAdminUser, dynamicAdmin, ...otherUsers];
  }, [storedUsers, dynamicAdminPass]);


  useEffect(() => {
    setIsLoading(true);
    if (loggedInUser) {
      const userFromStorage = allUsers.find(u => u.id === loggedInUser.id);
      if (userFromStorage) {
         const currentUserData: User = {
            id: userFromStorage.id,
            username: userFromStorage.username,
            phoneNumber: userFromStorage.phoneNumber,
            email: userFromStorage.email,
            role: userFromStorage.role,
            status: userFromStorage.status,
         };

         if (userFromStorage.username === 'Ahmed') {
            const expiration = passTimestamp + PASSWORD_LIFESPAN_MS;
            if (Date.now() > expiration) {
                // Session expired because password changed
                logout();
            } else {
                setUser(currentUserData);
                setSessionExpiresAt(expiration);
            }
         } else {
            setUser(currentUserData);
            setSessionExpiresAt(null);
         }
      } else {
        // Logged-in user doesn't exist anymore
        logout();
      }
    } else {
        setUser(null);
        setSessionExpiresAt(null);
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser, allUsers, passTimestamp]);
  

  const login = useCallback((username: string, pass: string): boolean => {
    const userToLogin = allUsers.find(
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
        sessionStarted: Date.now(),
      };
      setLoggedInUser(sessionUser);
      return true;
    }
    return false;
  }, [allUsers, setLoggedInUser]);

  const signup = useCallback((username: string, pass: string, phoneNumber: string = '', email: string): boolean => {
    const userExists = allUsers.some(u => 
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
        isFirstLogin: true,
        activatedAt: isApprovalSystemEnabled ? undefined : Date.now(),
    };
    setStoredUsers(prev => [...prev, newUser]);
    return true;
  }, [allUsers, setStoredUsers, isApprovalSystemEnabled]);
  
  const addUserByAdmin = useCallback((username: string, pass: string, phoneNumber: string, email: string, role: 'admin' | 'user'): boolean => {
    const userExists = allUsers.some(u => 
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
        status: 'active',
        isFirstLogin: role === 'user', // Admins don't need the welcome dialog
        activatedAt: Date.now(),
    };
    setStoredUsers(prev => [...prev, newUser]);
    return true;
  }, [allUsers, setStoredUsers]);
  
  const deleteUser = useCallback((userId: string) => {
    // Prevent deletion of the two main admin accounts
    if (userId === staticAdminUser.id || userId === dynamicAdminUserTemplate.id) return;
    setStoredUsers(prev => prev.filter(u => u.id !== userId));
  }, [setStoredUsers]);

  const updateUserRole = useCallback((userId: string, role: 'admin' | 'user') => {
    // Prevent role change for main admin accounts
    if (userId === staticAdminUser.id || userId === dynamicAdminUserTemplate.id) return;
    setStoredUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }, [setStoredUsers]);

  const toggleUserActiveStatus = useCallback((userId: string) => {
     // Prevent status change for main admin accounts
    if (userId === staticAdminUser.id || userId === dynamicAdminUserTemplate.id) return;
    setStoredUsers(prev => {
        const newUsers = prev.map(u => {
            if (u.id === userId) {
                const newStatus = u.status === 'active' ? 'banned' : 'active';
                const newActivatedAt = newStatus === 'active' ? Date.now() : u.activatedAt;
                return { ...u, status: newStatus, activatedAt: newActivatedAt };
            }
            return u;
        });
        return newUsers;
    });
}, [setStoredUsers]);
  
  const approveUser = useCallback((userId: string) => {
    setStoredUsers(prev => prev.map(u => 
      u.id === userId && u.status === 'pending' ? { ...u, status: 'active', activatedAt: Date.now() } : u
    ));
  }, [setStoredUsers]);

  const updateUser = useCallback((userId: string, updates: Partial<Omit<StoredUser, 'id'>>): boolean => {
    // Do not allow updating the username of the two main admin accounts
    if ((userId === staticAdminUser.id || userId === dynamicAdminUserTemplate.id) && updates.username) {
        delete updates.username;
    }

    // Allow HUNTER and Ahmed to share email/phone, but prevent others from using it.
    const isEditingPrivilegedAdmin = userId === staticAdminUser.id || userId === dynamicAdminUserTemplate.id;

    if (updates.email || (updates.phoneNumber && updates.phoneNumber.trim() !== '')) {
      const userExists = allUsers.some(u => {
        // Skip checking against self
        if (u.id === userId) return false;

        // If we are editing Ahmed, don't check for collision with HUNTER, and vice-versa.
        if (isEditingPrivilegedAdmin && (u.id === staticAdminUser.id || u.id === dynamicAdminUserTemplate.id)) {
          return false;
        }

        return (
          (updates.email && u.email === updates.email) || 
          (updates.phoneNumber && u.phoneNumber && u.phoneNumber === updates.phoneNumber)
        )
      });
      
      if (userExists) {
        return false;
      }
    }

    setStoredUsers(prev => 
      prev.map(u => (u.id === userId ? { ...u, ...updates } : u))
    );
    return true;
  }, [allUsers, setStoredUsers]);

  const toggleApprovalSystem = useCallback(() => {
    setIsApprovalSystemEnabled(prev => !prev);
  }, [setIsApprovalSystemEnabled]);
  
  const checkAndDeactivateUsers = useCallback(() => {
    const now = Date.now();
    const updatedUsers = storedUsers.map(u => {
        if (u.role === 'user' && u.status === 'active' && u.activatedAt) {
            if (now - u.activatedAt > USER_EXPIRY_DURATION_MS) {
                return { ...u, status: 'banned' as UserStatus };
            }
        }
        return u;
    });
    // Prevent infinite loops by only setting state if there's a change
    if (JSON.stringify(updatedUsers) !== JSON.stringify(storedUsers)) {
        setStoredUsers(updatedUsers);
    }
  }, [storedUsers, setStoredUsers]);
  
  const value = useMemo(() => ({
    user,
    users: allUsers,
    isLoading,
    sessionExpiresAt,
    passTimestamp,
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
    checkAndDeactivateUsers,
    checkAhmedSession,
  }), [user, allUsers, isLoading, sessionExpiresAt, passTimestamp, login, signup, logout, addUserByAdmin, deleteUser, updateUserRole, toggleUserActiveStatus, approveUser, updateUser, isApprovalSystemEnabled, toggleApprovalSystem, checkAndDeactivateUsers, checkAhmedSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
