"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export type Role = 'cutting_supervisor' | 'cutting_verifier' | 'sewing_supervisor';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (initialRole?: Role) => Promise<{ success: boolean; error?: string }>;
  getIdToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signInWithCredentials: async () => ({ success: false }),
  signInWithGoogle: async () => ({ success: false }),
  getIdToken: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize server session using current JWT cookie
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    // Listen for Firebase Auth state changes
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
            setUser(data.user);
          }
        } catch (syncErr) {
          console.error('Firebase backend sync failed:', syncErr);
        }
      }
    });

    return () => unsubscribe();
  }, [fetchSession]);

  // Sign In with Email & Password credentials
  const signInWithCredentials = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await result.user.getIdToken(true);

      const syncRes = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!syncRes.ok) {
        const errData = await syncRes.json();
        throw new Error(errData.error || 'Backend session verification failed');
      }

      const data = await syncRes.json();
      setUser(data.user);

      return { success: true };
    } catch (err: any) {
      console.error('Credentials sign-in error:', err);
      let errorMsg = err.message || 'Authentication failed';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMsg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'No user registered with this email in Firebase Authentication.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please try again later.';
      }
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Sign-In
  const signInWithGoogle = async (initialRole: Role = 'cutting_supervisor') => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);

      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, requestedRole: initialRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server database synchronization failed.');
      }

      const data = await res.json();
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout cleanly clears Firebase state and backend JWT cookie
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      setFirebaseUser(null);
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    try {
      return await firebaseUser.getIdToken();
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithCredentials,
        signInWithGoogle,
        getIdToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
