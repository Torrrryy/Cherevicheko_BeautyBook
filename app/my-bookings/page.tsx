"use client";

import { trpc } from "@/lib/trpc/provider";
import { AppointmentTable } from "@/components/appointments/appointment-table";

export default function MyBookingsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.appointments.list.useQuery();
  const cancel = trpc.appointments.cancel.useMutation({
    onSuccess: () => utils.appointments.list.invalidate()
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Мои записи</h1>
        <p className="text-sm text-muted-foreground">История и предстоящие визиты</p>
      </div>
      <div className="panel">
        {isLoading ? (
          <p>Загрузка...</p>
        ) : (
          <AppointmentTable
            rows={(data ?? []) as Parameters<typeof AppointmentTable>[0]["rows"]}
            onCancel={(id) => cancel.mutate({ id })}
            canCancel={(row) => row.status === "scheduled"}
          />
        )}
      </div>
    </div>
  );
}
