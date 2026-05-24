"use client";

import { trpc } from "@/lib/trpc/provider";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";

type AppointmentRow = {
  id: string;
  startsAt: Date;
  status: "scheduled" | "completed" | "cancelled";
  client: { name: string };
  staffMember: { name: string };
  service: { name: string; price: number; durationMinutes: number };
};

export function AppointmentTable({
  rows,
  onCancel,
  canCancel
}: {
  rows: AppointmentRow[];
  onCancel?: (id: string) => void;
  canCancel?: (row: AppointmentRow) => boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Записей нет</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Дата</th>
            <th className="py-2 pr-4 font-medium">Клиент</th>
            <th className="py-2 pr-4 font-medium">Мастер</th>
            <th className="py-2 pr-4 font-medium">Услуга</th>
            <th className="py-2 pr-4 font-medium">Статус</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60">
              <td className="py-3 pr-4">{formatDateTime(row.startsAt)}</td>
              <td className="py-3 pr-4">{row.client.name}</td>
              <td className="py-3 pr-4">{row.staffMember.name}</td>
              <td className="py-3 pr-4">
                {row.service.name}
                <span className="block text-xs text-muted-foreground">
                  {row.service.durationMinutes} мин · {formatPrice(row.service.price)}
                </span>
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={row.status} />
              </td>
              <td className="py-3 text-right">
                {onCancel && canCancel?.(row) ? (
                  <Button variant="outline" size="sm" onClick={() => onCancel(row.id)}>
                    Отменить
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AppointmentsListPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.appointments.list.useQuery();
  const cancel = trpc.appointments.cancel.useMutation({
    onSuccess: () => utils.appointments.list.invalidate()
  });

  if (isLoading) return <p>Загрузка...</p>;

  return (
    <AppointmentTable
      rows={(data ?? []) as AppointmentRow[]}
      onCancel={(id) => cancel.mutate({ id })}
      canCancel={(row) => row.status === "scheduled"}
    />
  );
}
