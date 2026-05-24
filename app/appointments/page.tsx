"use client";

import Link from "next/link";
import { AppointmentsListPage } from "@/components/appointments/appointment-table";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export default function AppointmentsPage() {
  const session = useSession();
  const role = session.data?.user?.role;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Записи</h1>
          <p className="text-sm text-muted-foreground">Все записи с учётом вашей роли</p>
        </div>
        {(role === "admin" || role === "client") && (
          <Link href="/appointments/new">
            <Button>Новая запись</Button>
          </Link>
        )}
      </div>
      <div className="panel">
        <AppointmentsListPage />
      </div>
    </div>
  );
}
