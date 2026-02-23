// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Fetch Profile
  // ---------------------------
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error('Unexpected profile error:', err.message);
      setProfile(null);
    }
  };

  // ---------------------------
  // Session Handling
  // ---------------------------
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    };

    initSession();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  // ---------------------------
  // Sign Up (Improved)
  // ---------------------------
  const signUp = async ({ email, password, options }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });

    if (error) {
      // Handle duplicate email cleanly
      if (error.status === 422) {
        return {
          data: null,
          error: {
            code: 'USER_EXISTS',
            message: 'User already registered'
          }
        };
      }

      return { data: null, error };
    }

    return { data, error: null };
  };

  // ---------------------------
  // Sign In
  // ---------------------------
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  };

  // ---------------------------
  // Refresh Profile
  // ---------------------------
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const value = {
    signUp,
    signIn,
    user,
    profile,
    loading,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};