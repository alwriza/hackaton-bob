'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string | undefined) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // navigator.lock race condition (multiple tabs open) — not a real error, retry silently
        if (error.message?.includes('Lock') && error.message?.includes('stole it')) {
          return null;
        }
        // PGRST116 = no rows found — profile was never created, auto-create it
        if (error.code === 'PGRST116') {
          const name = email?.split('@')[0] || 'Пользователь';
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: userId, name, role: 'USER', trust_score: 100, balance: 0, completed_jobs: 0 })
            .select()
            .single();

          if (insertError) {
            console.error('Error auto-creating profile:', insertError);
            return null;
          }
          return { ...newProfile, email: email || '' } as User;
        }
        console.error('Error fetching profile:', error);
        return null;
      }
      return { ...data, email: email || '' } as User;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const profile = await fetchProfile(authUser.id, authUser.email);
      setUser(profile);
    }
  };

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email);
        setUser(profile);
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email);
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
