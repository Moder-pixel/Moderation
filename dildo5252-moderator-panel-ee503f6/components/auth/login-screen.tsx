"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Gamepad2, LockKeyhole, LogIn, User } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  OwnerResetButton,
  OWNER_RESET_ENABLED,
} from "@/components/auth/owner-reset-button";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { authenticate, type SessionUser } from "@/lib/auth/auth-store";

const loginSchema = z.object({
  email: z.email("Введите корректную почту"),
  password: z.string().min(1, "Введите пароль"),
});

export function LoginScreen({
  onLogin,
}: {
  onLogin: (user: SessionUser) => void;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email: login, password });
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }

    setBusy(true);
    const result = await authenticate(parsed.data);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onLogin(result.data);
  }

  return (
    <div className="relative flex min-h-[calc(100vh-9rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="neon-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="glow-neon relative w-full max-w-md rounded-2xl border border-border/70 bg-card/85 p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="gradient-neon flex size-14 items-center justify-center rounded-2xl text-background">
            <Gamepad2 className="size-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Модератор<span className="text-primary">-панель</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Закрытая панель команды модераторов Minecraft-проекта
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="login"
              className="text-xs font-medium text-muted-foreground"
            >
              Логин (почта)
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login"
                type="text"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                placeholder="moderator@project.ru"
                autoComplete="username"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-xs font-medium text-muted-foreground"
            >
              Пароль
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pl-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            disabled={busy}
          >
            <LogIn data-icon="inline-start" />
            Войти
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <ThemeSwitcher />
          <p className="text-center text-xs text-muted-foreground">
            Данные для входа выдаёт владелец проекта. Если у вас их нет —
            обратитесь к администрации.
          </p>
          {OWNER_RESET_ENABLED && <OwnerResetButton />}
        </div>
      </div>
    </div>
  );
}
