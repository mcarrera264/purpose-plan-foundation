import { useEffect, useState } from "react";
import { User, X } from "lucide-react";
import { AccountMenu } from "./AccountMenu";

export function MobileAccountButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Cuenta"
        onClick={() => setOpen(true)}
        className="press fixed right-3 top-3 z-30 grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-ink bg-white md:hidden"
      >
        <User className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cuenta"
          className="fixed inset-0 z-50 flex items-end bg-ink/40 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl border-t-[1.5px] border-ink bg-white p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Cuenta</h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="press grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-ink bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AccountMenu />
          </div>
        </div>
      )}
    </>
  );
}
