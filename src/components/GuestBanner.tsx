import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const DISMISS_KEY = "pp:guest-banner-dismissed";

export function GuestBanner() {
  const { isGuest } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!isGuest || dismissed) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border-[1.5px] border-ink bg-[var(--area-career)]/40 px-4 py-3 text-sm text-ink">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <strong className="font-semibold">Estás usando una cuenta de invitado.</strong>{" "}
        Guarda tu cuenta desde el perfil para acceder desde otros dispositivos sin perder tus datos.
      </div>
      <button
        type="button"
        aria-label="Ocultar aviso"
        onClick={() => {
          setDismissed(true);
          window.localStorage.setItem(DISMISS_KEY, "1");
        }}
        className="press grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink/20 bg-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
