"use client";

import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  Plus,
  Scissors,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { trpc } from "@/lib/trpc/provider";
import { cn, formatDateTime, toDateStringLocal } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";

const quickLinks = [
  {
    href: "/appointments/new",
    title: "Новая запись",
    description: "Записать клиента к мастеру",
    icon: Plus,
    accent: "from-primary/20 to-primary/5"
  },
  {
    href: "/calendar",
    title: "Календарь",
    description: "Расписание на неделю",
    icon: CalendarDays,
    accent: "from-violet-500/15 to-violet-500/5"
  },
  {
    href: "/clients",
    title: "Клиенты",
    description: "Справочник и история",
    icon: Users,
    accent: "from-sky-500/15 to-sky-500/5"
  },
  {
    href: "/staff",
    title: "Мастера",
    description: "Команда салона",
    icon: Scissors,
    accent: "from-amber-500/15 to-amber-500/5"
  }
] as const;

function StatCard({
  label,
  value,
  hint,
  icon: Icon
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: typeof Users;
}) {
  return (
    <div className="panel flex items-start gap-4 transition-shadow hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

export function AdminDashboard({ userName }: { userName: string }) {
  const today = toDateStringLocal(new Date());

  const { data: appointments, isLoading: loadingAppts } = trpc.appointments.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: staff } = trpc.staff.list.useQuery();
  const { data: services } = trpc.services.list.useQuery();

  const scheduled = appointments?.filter((a) => a.status === "scheduled") ?? [];
  const todayAppts = scheduled.filter((a) => toDateStringLocal(new Date(a.startsAt)) === today);
  const upcoming = scheduled
    .filter((a) => new Date(a.startsAt) >= new Date())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Доброе утро";
    if (h < 18) return "Добрый день";
    return "Добрый вечер";
  })();

  const dateLabel = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-accent/30 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Панель администратора
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {greeting}, {userName}
            </h1>
            <p className="mt-2 capitalize text-muted-foreground">{dateLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/appointments/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Новая запись
              </Button>
            </Link>
            <Link href="/appointments">
              <Button variant="outline" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Все записи
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Клиентов" value={clients?.length ?? "—"} icon={Users} />
        <StatCard label="Мастеров" value={staff?.length ?? "—"} icon={Scissors} />
        <StatCard label="Услуг" value={services?.length ?? "—"} icon={Sparkles} />
        <StatCard
          label="Сегодня"
          value={loadingAppts ? "…" : todayAppts.length}
          hint={`${scheduled.length} активных записей`}
          icon={TrendingUp}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Быстрые действия
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group panel flex items-center gap-4 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                      link.accent
                    )}
                  >
                    <Icon className="h-5 w-5 text-foreground/80 group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{link.title}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ближайшие записи
            </h2>
            <Link href="/calendar" className="text-xs font-medium text-primary hover:underline">
              Календарь →
            </Link>
          </div>
          <div className="panel">
            {loadingAppts ? (
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            ) : upcoming.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Нет предстоящих записей</p>
                <Link href="/appointments/new" className="mt-4 inline-block">
                  <Button size="sm">Создать запись</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium">{formatDateTime(a.startsAt)}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.client.name} · {a.staffMember.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.service.name}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
