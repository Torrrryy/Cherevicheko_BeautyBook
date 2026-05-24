"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";

export default function NewAppointmentPage() {
  const router = useRouter();
  const session = useSession();
  const role = session.data?.user?.role;

  const { data: services } = trpc.services.list.useQuery();
  const { data: staffList } = trpc.staff.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: role === "admin"
  });

  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [availability, setAvailability] = useState<string | null>(null);

  const create = trpc.appointments.create.useMutation({
    onSuccess: () => router.push("/appointments")
  });

  const check = trpc.staff.checkAvailability.useQuery(
    {
      staffId,
      serviceId,
      startsAt: new Date(startsAt)
    },
    { enabled: Boolean(staffId && serviceId && startsAt) }
  );

  useEffect(() => {
    if (!check.data) return;
    setAvailability(check.data.available ? "Слот свободен" : (check.data.reason ?? "Мастер занят"));
  }, [check.data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      clientId: role === "admin" ? clientId : undefined,
      staffId,
      serviceId,
      startsAt: new Date(startsAt)
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Новая запись</h1>
      <form onSubmit={onSubmit} className="panel space-y-4">
        {role === "admin" && (
          <Field label="Клиент">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Выберите клиента</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Услуга">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
          >
            <option value="">Выберите услугу</option>
            {services?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} мин)
              </option>
            ))}
          </select>
        </Field>

        <Field label="Мастер">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            required
          >
            <option value="">Выберите мастера</option>
            {staffList?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.specialization}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Дата и время">
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </Field>

        {availability ? (
          <p className={check.data?.available ? "text-sm text-primary" : "text-sm text-destructive"}>{availability}</p>
        ) : null}

        <Button type="submit" disabled={create.isPending || check.data?.available === false} className="w-full">
          {create.isPending ? "Сохранение..." : "Записать"}
        </Button>
        {create.error ? <p className="text-sm text-destructive">{create.error.message}</p> : null}
      </form>
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
