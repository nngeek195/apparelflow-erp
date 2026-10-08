'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR' | string;

export interface CustomUser {
  id: string;
  email?: string;
  fullName?: string;
  role?: Role;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch initial session on load
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.fullName,
          role: session.user.user_metadata?.role,
        });
      }
      setLoading(false);
    };

    fetchSession();

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.fullName,
          role: session.user.user_metadata?.role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);