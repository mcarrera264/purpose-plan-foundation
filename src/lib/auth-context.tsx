import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  isGuest: false,
  loading: true,
  initialized: false,
});

async function bootstrapUser(displayName?: string | null) {
  try {
    const args: { p_display_name?: string } = {};
    if (displayName) args.p_display_name = displayName;
    const { error } = await supabase.rpc("initialize_current_user", args);
    if (error) console.error("initialize_current_user", error.message);
  } catch (e) {
    console.error(e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      setSession(s);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        const name =
          (s?.user?.user_metadata?.display_name as string | undefined) ??
          (s?.user?.user_metadata?.full_name as string | undefined) ??
          (s?.user?.user_metadata?.name as string | undefined) ??
          null;
        setTimeout(() => {
          void bootstrapUser(name);
        }, 0);
      }
    });

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        if (data.session) await bootstrapUser();
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
        setInitialized(true);
      });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const isGuest = !!user && user.is_anonymous === true;

  return (
    <AuthContext.Provider value={{ session, user, isGuest, loading, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
