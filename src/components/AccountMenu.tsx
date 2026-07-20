import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { User, LogOut, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function AccountMenu() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [saveOpen, setSaveOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.email ? user.email.split("@")[0] : null) ??
    (isGuest ? "Invitado" : "Cuenta");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-ink bg-white p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-surface-muted">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="truncate text-sm font-semibold text-ink">{displayName}</div>
              {isGuest && (
                <span className="rounded-full border border-ink/30 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/70">
                  Invitado
                </span>
              )}
            </div>
            <div className="truncate text-xs text-text-secondary">
              {isGuest ? "No guardado" : user?.email ?? "Cuenta"}
            </div>
          </div>
        </div>

        {isGuest && (
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            className="press inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-[var(--area-career)] text-xs font-semibold text-ink"
          >
            <Save className="h-4 w-4" strokeWidth={2.5} />
            Guardar mi cuenta
          </button>
        )}

        <button
          type="button"
          onClick={() => (isGuest ? setConfirmSignOut(true) : signOut())}
          className="press inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-transparent text-xs font-medium text-ink/70 hover:border-ink hover:text-ink"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>

      {saveOpen && <SaveAccountDialog onClose={() => setSaveOpen(false)} />}
      {confirmSignOut && (
        <ConfirmDialog
          title="¿Cerrar sesión de invitado?"
          description="Perderás el acceso a los datos creados como invitado en este dispositivo. Puedes guardar tu cuenta antes de cerrar sesión."
          confirmLabel="Cerrar sesión"
          onConfirm={async () => {
            setConfirmSignOut(false);
            await signOut();
          }}
          onCancel={() => setConfirmSignOut(false)}
          onSaveInstead={() => {
            setConfirmSignOut(false);
            setSaveOpen(true);
          }}
        />
      )}
    </>
  );
}

function SaveAccountDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<null | "email" | "google">(null);
  const [sent, setSent] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function linkEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setSent(true);
      toast.success("Te enviamos un email para confirmar");
    } catch (e: any) {
      const msg = e.message ?? "No pudimos vincular el email";
      if (/already/i.test(msg) || /registered/i.test(msg) || /exists/i.test(msg)) {
        toast.error(
          "Ese email ya pertenece a otra cuenta. Puedes cancelar y seguir como invitado, o iniciar sesión en esa cuenta desde la pantalla de entrada.",
          { duration: 8000 },
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(null);
    }
  }

  async function linkGoogle() {
    setBusy("google");
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (e: any) {
      const msg = e.message ?? "No pudimos vincular Google";
      if (/identity_already_exists/i.test(msg) || /already/i.test(msg)) {
        toast.error(
          "Esa cuenta de Google ya pertenece a otro usuario. Puedes cancelar y seguir como invitado.",
          { duration: 8000 },
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-account-title"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border-[1.5px] border-ink bg-white p-6 outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="save-account-title" className="text-lg font-bold text-ink">
              Guardar mi cuenta
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Vincula un email o Google para usar tu cuenta en otros dispositivos. Tus datos actuales se conservan.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="press grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-ink bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="mt-5 rounded-2xl border border-ink/15 bg-surface-muted p-4 text-sm text-ink">
            Revisa tu email <strong>{email}</strong> y abre el enlace para confirmar. Tu sesión actual se mantiene.
          </div>
        ) : (
          <>
            <form onSubmit={linkEmail} className="mt-5 flex flex-col gap-2">
              <label htmlFor="link-email" className="text-sm font-semibold text-ink">
                Vincular email
              </label>
              <input
                id="link-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="h-12 rounded-2xl border-[1.5px] border-ink bg-white px-4 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                disabled={busy === "email"}
                className="press inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-ink bg-ink text-sm font-semibold text-background disabled:opacity-60"
              >
                {busy === "email" ? "Enviando…" : "Enviar enlace de verificación"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-text-secondary">
              <span className="h-px flex-1 bg-ink/10" /> o <span className="h-px flex-1 bg-ink/10" />
            </div>

            <button
              type="button"
              onClick={linkGoogle}
              disabled={busy === "google"}
              className="press inline-flex h-12 w-full items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-sm font-semibold text-ink disabled:opacity-60"
            >
              {busy === "google" ? "Abriendo Google…" : "Vincular con Google"}
            </button>

            <p className="mt-4 text-xs text-text-secondary">
              Si el email o la cuenta de Google ya pertenecen a otro usuario, no fusionamos datos automáticamente:
              podrás cancelar y seguir como invitado.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  onSaveInstead,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  onSaveInstead?: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border-[1.5px] border-ink bg-white p-6"
      >
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
        <div className="mt-5 flex flex-col gap-2">
          {onSaveInstead && (
            <button
              type="button"
              onClick={onSaveInstead}
              className="press inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-[var(--area-career)] text-sm font-semibold text-ink"
            >
              Guardar mi cuenta antes
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="press inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-sm font-semibold text-ink"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="press inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-transparent text-sm font-medium text-ink/70"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
