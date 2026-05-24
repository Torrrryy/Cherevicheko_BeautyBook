"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthPanel } from "@/components/auth/auth-panel";
import { useSession } from "@/lib/auth-client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const session = useSession();

  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <AuthPanel />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-10 md:pb-16 md:pt-10">{children}</main>
      </div>
    </div>
  );
}
