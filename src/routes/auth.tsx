import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Purpose Plan" },
      { name: "description", content: "Continúa como invitado o accede con Google o email." },
    ],
  }),
  component: AuthScreen,
});

type Mode = "landing" | "email" | "otp";

function AuthScreen() {
  const navigate = useNavigate();
  const { session, initialized } = useAuth();
  const [mode, setMode] = useState<Mode>("landing");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<null | "guest" | "google" | "email" | "otp">(null);

  useEffect(() => {
    if (initialized && session) navigate({ to: "/", replace: true });
  }, [initialized, session, navigate]);

  async function continueAsGuest() {
    setBusy("guest");
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      toast.success("Sesión de invitado creada");
    } catch (e: any) {
      toast.error(e.message ?? "No pudimos crear la sesión");
    } finally {
      setBusy(null);
    }
  }

  async function continueWithGoogle() {
    setBusy("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (e: any) {
      toast.error(e.message ?? "No pudimos iniciar con Google");
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy("email");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setMode("otp");
      toast.success("Te enviamos un código y un enlace");
    } catch (e: any) {
      toast.error(e.message ?? "No pudimos enviar el email");
    } finally {
      setBusy(null);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    setBusy("otp");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error(e.message ?? "Código incorrecto");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border-[1.5px] border-ink bg-[var(--area-career)]">
            <span className="text-xl font-extrabold text-ink">P</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Purpose Plan</h1>
          <p className="text-sm text-text-secondary">De objetivos a próximos pasos.</p>
        </header>

        {mode === "landing" && (
          <div className="flex flex-col gap-3 rounded-3xl border-[1.5px] border-ink bg-white p-5">
            <button
              type="button"
              disabled={!!busy}
              onClick={continueAsGuest}
              className="press inline-flex h-12 w-full items-center justify-center rounded-full border-[1.5px] border-ink bg-ink text-sm font-semibold text-background disabled:opacity-60"
            >
              {busy === "guest" ? "Creando sesión…" : "Continuar como invitado"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={continueWithGoogle}
              className="press inline-flex h-12 w-full items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-sm font-semibold text-ink disabled:opacity-60"
            >
              {busy === "google" ? "Abriendo Google…" : "Continuar con Google"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => setMode("email")}
              className="press inline-flex h-12 w-full items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-sm font-semibold text-ink disabled:opacity-60"
            >
              Continuar con email
            </button>
            <p className="mt-2 text-center text-xs text-text-secondary">
              Como invitado puedes usar la app y guardar tu cuenta más tarde sin perder datos.
            </p>
          </div>
        )}

        {mode === "email" && (
          <form
            onSubmit={sendEmail}
            className="flex flex-col gap-3 rounded-3xl border-[1.5px] border-ink bg-white p-5"
          >
            <label htmlFor="email" className="text-sm font-semibold text-ink">
              Tu email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
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
              {busy === "email" ? "Enviando…" : "Enviarme el enlace"}
            </button>
            <button
              type="button"
              onClick={() => setMode("landing")}
              className="text-xs text-text-secondary underline"
            >
              Volver
            </button>
          </form>
        )}

        {mode === "otp" && (
          <form
            onSubmit={verifyOtp}
            className="flex flex-col gap-3 rounded-3xl border-[1.5px] border-ink bg-white p-5"
          >
            <p className="text-sm text-ink">
              Revisa tu email. Puedes abrir el enlace o pegar el código de 6 dígitos.
            </p>
            <label htmlFor="code" className="text-sm font-semibold text-ink">
              Código
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="h-12 rounded-2xl border-[1.5px] border-ink bg-white px-4 text-sm tracking-widest text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            />
            <button
              type="submit"
              disabled={busy === "otp"}
              className="press inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-ink bg-ink text-sm font-semibold text-background disabled:opacity-60"
            >
              {busy === "otp" ? "Verificando…" : "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              className="text-xs text-text-secondary underline"
            >
              Usar otro email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
