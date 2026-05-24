"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/provider";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";

export default function ServicesPage() {
  const session = useSession();
  const role = session.data?.user?.role;
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.services.list.useQuery();

  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(2000);
  const [upcomingServiceId, setUpcomingServiceId] = useState<string | null>(null);

  const create = trpc.services.create.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      setName("");
    }
  });

  const upcoming = trpc.services.upcomingAppointments.useQuery(
    { serviceId: upcomingServiceId! },
    { enabled: Boolean(upcomingServiceId) }
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-2xl font-semibold">Услуги</h1>

      {role === "admin" && (
        <form
          className="panel grid gap-4 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ name, durationMinutes, price });
          }}
        >
          <Field label="Название">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Длительность (мин)">
            <Input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Цена (₽)">
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={create.isPending}>
              Добавить
            </Button>
          </div>
        </form>
      )}

      <div className="panel">
        {isLoading ? (
          <p>Загрузка...</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {data?.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground">
                    {s.durationMinutes} мин · {formatPrice(s.price)}
                  </p>
                </div>
                {(role === "admin" || role === "staff") && (
                  <Button variant="outline" size="sm" onClick={() => setUpcomingServiceId(s.id)}>
                    Предстоящие записи
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {upcomingServiceId && upcoming.data ? (
        <div className="panel">
          <h2 className="mb-4 font-semibold">Предстоящие записи по услуге</h2>
          <ul className="space-y-2 text-sm">
            {upcoming.data.length === 0 ? (
              <li className="text-muted-foreground">Нет предстоящих записей</li>
            ) : (
              upcoming.data.map((a) => (
                <li key={a.id} className="flex justify-between border-b border-border/40 py-2">
                  <span>
                    {a.client.name} — {a.staffMember.name}
                  </span>
                  <span className="text-muted-foreground">{formatDateTime(a.startsAt)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
