"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Sparkles,
  UserCircle,
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/provider";
import { Button } from "@/components/ui/button";

type UserRole = "admin" | "staff" | "client";

type NavItem = {
  href: string;
  title: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};

const allLinks: NavItem[] = [
  { href: "/", title: "Главная", icon: LayoutDashboard, roles: ["admin", "staff", "client"] },
  { href: "/appointments", title: "Записи", icon: ClipboardList, roles: ["admin", "staff", "client"] },
  { href: "/appointments/new", title: "Новая запись", icon: Sparkles, roles: ["admin", "client"] },
  { href: "/calendar", title: "Календарь", icon: CalendarDays, roles: ["admin", "staff"] },
  { href: "/clients", title: "Клиенты", icon: Users, roles: ["admin"] },
  { href: "/staff", title: "Мастера", icon: Scissors, roles: ["admin"] },
  { href: "/services", title: "Услуги", icon: Sparkles, roles: ["admin", "staff", "client"] },
  { href: "/my-schedule", title: "Моё расписание", icon: CalendarDays, roles: ["staff"] },
  { href: "/my-bookings", title: "Мои записи", icon: UserCircle, roles: ["client"] }
];

const roleLabels: Record<UserRole, string> = {
  admin: "Администратор",
  staff: "Мастер",
  client: "Клиент"
};

function SidebarNavLinks({
  pathname,
  links,
  onNavigate
}: {
  pathname: string;
  links: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 px-2 py-3">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-active text-sidebar-foreground"
                : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const utils = trpc.useUtils();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    await session.refetch();
    utils.invalidate();
    setMobileOpen(false);
    setSigningOut(false);
    router.push("/");
    router.refresh();
  }

  const role = (session.data?.user?.role ?? "client") as UserRole;
  const links = session.data ? allLinks.filter((item) => item.roles.includes(role)) : [];

  const sidebarInner = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">BeautyBook</p>
          <p className="truncate text-[11px] text-sidebar-muted">Салон красоты</p>
        </div>
        <button
          type="button"
          className="focus-ring rounded-md p-2 text-sidebar-muted md:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {session.data ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarNavLinks pathname={pathname} links={links} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="shrink-0 border-t border-sidebar-border p-3">
            <p className="mb-2 truncate px-2 text-xs text-sidebar-muted">{session.data.user.email}</p>
            <p className="mb-3 truncate px-2 text-[11px] text-sidebar-muted">{roleLabels[role]}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 border-transparent bg-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Выход..." : "Выйти"}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col px-4 py-6">
          <p className="text-sm leading-relaxed text-sidebar-muted">
            Войдите или зарегистрируйтесь, чтобы открыть разделы приложения.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex min-h-screen w-[min(17rem,85vw)] flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarInner}
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/95 px-3 backdrop-blur md:hidden">
        <button
          type="button"
          className="focus-ring rounded-lg p-2 text-foreground"
          aria-label="Открыть меню"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">BeautyBook</span>
      </div>
    </>
  );
}
