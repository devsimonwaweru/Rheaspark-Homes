/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null); // 1. Add session state
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function getUserRole(userId) {
    // Check landlords table for role (or roles table if you use that)
    // Keeping your existing logic for role check
    const { data, error } = await supabase
      .from("landlords") 
      .select("id")
      .eq("id", userId)
      .single();

    if (data) setRole('landlord');
    else setRole('user');
  }

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session;
      
      setSession(currentSession); // 2. Set session
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await getUserRole(currentSession.user.id);
      }

      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session); // 3. Update session on change
        setUser(session?.user ?? null);

        if (session?.user) {
          await getUserRole(session.user.id);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 4. Pass session in value
  return (
    <AuthContext.Provider value={{ user, session, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}