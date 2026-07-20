import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: ReactNode }) {
  const { initialized, session } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!initialized) return;
    if (!session && pathname !== "/auth") {
      navigate({ to: "/auth", replace: true });
    }
  }, [initialized, session, pathname, navigate]);

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-text-secondary">Restaurando sesión…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-text-secondary">Redirigiendo…</div>
      </div>
    );
  }

  return <>{children}</>;
}
