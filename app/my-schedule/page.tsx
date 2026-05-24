"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/provider";
import { formatDateTime, toDateStringLocal } from "@/lib/utils";

function todayInput() {
  return toDateStringLocal(new Date());
}

export default function MySchedulePage() {
  const { data: profile } = trpc.staff.myProfile.useQuery();
  const [date, setDate] = useState(todayInput);

  const schedule = trpc.staff.scheduleByDay.useQuery(
    { staffId: profile?.id ?? "", date },
    { enabled: Boolean(profile?.id) }
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Моё расписание</h1>
      {profile ? (
        <p className="text-muted-foreground">
          {profile.name} · {profile.specialization}
        </p>
      ) : null}

      <div className="panel">
        <label className="mb-2 block text-sm font-medium">День</label>
        <input
          type="date"
          className="rounded-md border border-input px-3 py-2 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="panel">
        {schedule.isLoading ? (
          <p>Загрузка...</p>
        ) : schedule.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">На этот день записей нет</p>
        ) : (
          <ul className="space-y-3">
            {schedule.data?.map((a) => (
              <li key={a.id} className="rounded-lg border border-border/60 p-4 text-sm">
                <p className="font-medium">{formatDateTime(a.startsAt)}</p>
                <p>{a.service.name}</p>
                <p className="text-muted-foreground">Клиент: {a.client.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
