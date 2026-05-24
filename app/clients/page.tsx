"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.clients.list.useQuery();
  const create = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setName("");
      setPhone("");
      setEmail("");
    }
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);

  const history = trpc.clients.history.useQuery(
    { clientId: historyClientId! },
    { enabled: Boolean(historyClientId) }
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-2xl font-semibold">Клиенты</h1>

      <form
        className="panel grid gap-4 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ name, phone, email });
        }}
      >
        <Field label="Имя">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Телефон">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 text-left">Имя</th>
                <th className="py-2 text-left">Телефон</th>
                <th className="py-2 text-left">Email</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.phone}</td>
                  <td className="py-2">{c.email}</td>
                  <td className="py-2 text-right">
                    <Button variant="outline" size="sm" onClick={() => setHistoryClientId(c.id)}>
                      История
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {historyClientId && history.data ? (
        <div className="panel">
          <h2 className="mb-4 font-semibold">История визитов</h2>
          <ul className="space-y-2 text-sm">
            {history.data.map((a) => (
              <li key={a.id} className="flex justify-between border-b border-border/40 py-2">
                <span>
                  {a.service.name} — {a.staffMember.name}
                </span>
                <span className="text-muted-foreground">{new Date(a.startsAt).toLocaleString("ru-RU")}</span>
              </li>
            ))}
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
