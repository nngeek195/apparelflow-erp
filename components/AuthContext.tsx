"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export type Role = 'cutting_supervisor' | 'cutting_verifier' | 'sewing_supervisor';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isDemo: boolean;
}

interface RoleOption {
  role: Role;
  title: string;
  description: string;
  avatar: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  switchRole: (role: Role) => Promise<void>;
  signInWithGoogle: (initialRole?: Role) => Promise<void>;
  logout: () => Promise<void>;
  availableRoles: RoleOption[];
}

const defaultRoles: RoleOption[] = [
  {
    role: 'cutting_supervisor',
    title: 'Cutting Supervisor',
    description: 'Creates orders, tracks fabric consumption & cutting flow',
    avatar: '✂️',
  },
  {
    role: 'cutting_verifier',
    title: 'Cutting Verifier',
    description: 'Component piece counts, color status flags & QA sign-off',
    avatar: '🔍',
  },
  {
    role: 'sewing_supervisor',
    title: 'Sewing Supervisor',
    description: 'Accepts verified batches into sewing line assembly',
    avatar: '🧵',
  },
];

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  switchRole: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  availableRoles: defaultRoles,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current session from server (respects demo cookie or firebase token)
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const syncRes = await fetch('/api/auth/register-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          if (syncRes.ok) {
            const data = await syncRes.json();
            setUser({
              ...data.user,
              isDemo: false,
            });
          }
        } catch (syncErr) {
          console.error('Firebase backend sync failed:', syncErr);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 1-Click Role Switcher for Audit Evaluation
  const switchRole = async (newRole: Role) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await fetchSession();
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real Google Sign-In with Firebase
  const signInWithGoogle = async (initialRole: Role = 'cutting_supervisor') => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, requestedRole: initialRole }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          ...data.user,
          isDemo: false,
        });
      } else {
        alert('Server database synchronization failed.');
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      alert('Google Sign-In encountered an error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setFirebaseUser(null);
      // Reset demo role to cutting_supervisor
      await switchRole('cutting_supervisor');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        switchRole,
        signInWithGoogle,
        logout,
        availableRoles: defaultRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
