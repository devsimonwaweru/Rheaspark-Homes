/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function getUserRole(userId) {
    const { data, error } = await supabase
      .from("roles")
      .select("role")
      .eq("id", userId)
      .single();

    if (data) setRole(data.role);
  }

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        await getUserRole(currentUser.id);
      }

      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          await getUserRole(currentUser.id);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}