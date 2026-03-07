
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkUserStatus = async () => {
      try {
        // 1. Get Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        setSession(session);

        if (session) {
          const userId = session.user.id;

          // 2. Check if Landlord
          const { data: landlordData } = await supabase
            .from('landlords')
            .select('subscription_status')
            .eq('id', userId)
            .single();

          if (landlordData) {
            setUserRole('landlord');
            // Check if subscription is active (Assuming 'active' is the string in DB)
            const subscribed = landlordData.subscription_status === 'active';
            setIsSubscribed(subscribed);
          } else {
            // 3. Check if Mover
            const { data: moverData } = await supabase
              .from('movers')
              .select('id')
              .eq('id', userId)
              .single();

            if (moverData) {
              setUserRole('mover');
              setIsSubscribed(true); // Movers don't require subscription for this logic
            } else {
              // 4. Default User
              setUserRole('user');
              setIsSubscribed(true);
            }
          }
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkUserStatus();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserRole(null);
        setIsSubscribed(false);
      } else {
        // Re-check status on auth change just in case
        checkUserStatus();
      }
    });

    return () => {
      isMounted = false;
      if (listener && listener.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-lg font-semibold text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 1. Not Logged In -> Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 2. Landlord Check: Not Subscribed -> Redirect to Subscription Page
  // We allow access if they are already on the subscription page to prevent loops
  if (userRole === 'landlord' && !isSubscribed && location.pathname !== '/subscription') {
    return <Navigate to="/subscription" replace />;
  }

  // 3. Access Granted
  return children;
}