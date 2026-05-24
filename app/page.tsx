"use client";

import { useSession } from "@/lib/auth-client";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const session = useSession();
  const role = session.data!.user.role;
  const userName = session.data!.user.name;

  if (role === "admin") {
    return <AdminDashboard userName={userName} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="panel">
        <h1 className="text-2xl font-semibold">Добро пожаловать, {userName}</h1>
        <p className="mt-2 text-muted-foreground">
          Роль: {role === "staff" ? "Мастер" : "Клиент"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/appointments">
            <Button>Записи</Button>
          </Link>
          {role === "client" && (
            <>
              <Link href="/appointments/new">
                <Button variant="outline">Новая запись</Button>
              </Link>
              <Link href="/my-bookings">
                <Button variant="outline">Мои записи</Button>
              </Link>
            </>
          )}
          {role === "staff" && (
            <Link href="/my-schedule">
              <Button variant="outline">Моё расписание</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
