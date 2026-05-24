"use client";

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/provider";
import { addDays, formatDateTime, parseLocalDate, startOfWeekMonday, toDateStringLocal } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

export default function CalendarPage() {
  const session = useSession();
  const role = session.data?.user?.role;
  const [weekStart, setWeekStart] = useState(() => toDateStringLocal(startOfWeekMonday(new Date())));
  const [staffId, setStaffId] = useState("");

  const { data: staffList } = trpc.staff.list.useQuery();
  const { data: myStaff } = trpc.staff.myProfile.useQuery(undefined, {
    enabled: role === "staff"
  });

  useEffect(() => {
    if (role === "admin" && staffList?.length && !staffId) {
      setStaffId(staffList[0]!.id);
    }
  }, [role, staffList, staffId]);

  const effectiveStaffId = role === "staff" ? (myStaff?.id ?? "") : staffId;

  const { data: weekAppointments, isLoading } = trpc.staff.scheduleByWeek.useQuery(
    { staffId: effectiveStaffId, weekStart },
    { enabled: Boolean(effectiveStaffId) }
  );

  const days = useMemo(() => {
    const start = parseLocalDate(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      const key = toDateStringLocal(date);
      const items =
        weekAppointments?.filter((a) => toDateStringLocal(new Date(a.startsAt)) === key) ?? [];
      return { date, key, items };
    });
  }, [weekAppointments, weekStart]);

  const needsStaffPick = role === "admin" && !effectiveStaffId;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Календарь</h1>
        <p className="text-sm text-muted-foreground">Расписание мастера на неделю</p>
      </div>

      <div className="panel flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Неделя с</label>
          <input
            type="date"
            className="rounded-md border border-input px-3 py-2 text-sm"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>
        {role === "admin" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Мастер</label>
            <select
              className="rounded-md border border-input px-3 py-2 text-sm"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              <option value="">Выберите мастера</option>
              {staffList?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {needsStaffPick ? (
        <p className="text-sm text-muted-foreground">Выберите мастера, чтобы увидеть записи.</p>
      ) : isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-7">
          {days.map((day) => (
            <div key={day.key} className="panel min-h-[120px] p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {day.date.toLocaleDateString("ru-RU", {
                  weekday: "short",
                  day: "numeric",
                  month: "short"
                })}
              </p>
              <ul className="space-y-2">
                {day.items.length === 0 ? (
                  <li className="text-xs text-muted-foreground">—</li>
                ) : (
                  day.items.map((a) => (
                    <li key={a.id} className="rounded-lg bg-muted/60 p-2 text-xs">
                      <p className="font-medium">{formatDateTime(a.startsAt).split(",")[1]?.trim()}</p>
                      <p>{a.service.name}</p>
                      <p className="text-muted-foreground">{a.client.name}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
