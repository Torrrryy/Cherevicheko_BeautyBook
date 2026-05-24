"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StaffPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.staff.list.useQuery();
  const create = trpc.staff.create.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
      setName("");
      setSpecialization("");
    }
  });

  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold">Мастера</h1>

      <form
        className="panel grid gap-4 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ name, specialization });
        }}
      >
        <Field label="Имя">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Специализация">
          <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} required />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={create.isPending}>
            Добавить
          </Button>
        </div>
      </form>

      <div className="panel">
        {isLoading ? (
          <p>Загрузка...</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {data?.map((s) => (
              <li key={s.id} className="flex justify-between py-3 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{s.specialization}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
