import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { AuthGate } from "./AuthGate";
import { GuestBanner } from "./GuestBanner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen w-full bg-background text-foreground">
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <main className="flex-1 min-w-0 pb-24 md:pb-0">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
              <GuestBanner />
              {children}
            </div>
          </main>
        </div>
        <MobileNavigation />
      </div>
    </AuthGate>
  );
}
