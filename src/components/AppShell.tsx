import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { MobileAccountButton } from "./MobileAccountButton";
import { AuthGate } from "./AuthGate";
import { GuestBanner } from "./GuestBanner";
import { DemoBadge } from "./DemoBadge";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen w-full bg-background text-foreground">
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <main className="flex-1 min-w-0 pb-24 md:pb-0">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <DemoBadge />
              </div>
              <GuestBanner />
              {children}
            </div>
          </main>
        </div>
        <MobileNavigation />
        <MobileAccountButton />
      </div>
    </AuthGate>
  );
}
