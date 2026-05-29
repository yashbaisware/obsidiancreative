import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let requestId = 0;

    const fetchAdminRole = async (uid: string) => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (error) {
        console.warn("Admin role check failed", error.message);
        return false;
      }
      return !!data;
    };

    const hydrateAuth = async (sessionUser: User | null) => {
      const currentRequest = ++requestId;
      if (cancelled) return;

      setUser(sessionUser);
      setLoading(true);

      if (!sessionUser) {
        if (!cancelled && currentRequest === requestId) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      const admin = await fetchAdminRole(sessionUser.id);
      if (cancelled || currentRequest !== requestId) return;

      setUser(sessionUser);
      setIsAdmin(admin);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(true);
      setTimeout(() => {
        void hydrateAuth(nextUser);
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        void hydrateAuth(session?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, isAdmin, loading };
}
