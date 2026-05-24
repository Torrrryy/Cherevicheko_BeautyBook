"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "register" | "login";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Салон красоты</h1>
        <p className="mt-2 text-sm text-muted-foreground">Онлайн-запись к мастерам</p>
      </div>

      <div className="mb-6 flex rounded-xl border border-border bg-muted/40 p-1">
        <Tab active={mode === "login"} onClick={() => setMode("login")}>
          Вход
        </Tab>
        <Tab active={mode === "register"} onClick={() => setMode("register")}>
          Регистрация
        </Tab>
      </div>

      {mode === "login" ? (
        <LoginForm onSuccess={() => router.refresh()} />
      ) : (
        <RegisterForm onSuccess={() => router.refresh()} />
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signIn.email({ email, password });
    setPending(false);
    if (res.error) {
      setError(res.error.message ?? "Ошибка входа");
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Пароль">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Вход..." : "Войти"}
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signUp.email({ email, password, name });
    setPending(false);
    if (res.error) {
      setError(res.error.message ?? "Ошибка регистрации");
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Имя">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Пароль">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Регистрация..." : "Зарегистрироваться"}
      </Button>
    </form>
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
