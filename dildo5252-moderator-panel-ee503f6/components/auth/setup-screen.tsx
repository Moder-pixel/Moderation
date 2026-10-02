"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, User } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { bootstrapAccount, type SessionUser } from "@/lib/auth/auth-store";

const setupSchema = z
  .object({
    email: z.email("Введите корректную почту"),
    nickname: z.string().trim().min(2, "Ник слишком короткий"),
    password: z.string().min(4, "Пароль должен быть не короче 4 символов"),
    passwordConfirm: z.string(),
    adminPassword: z
      .string()
      .min(4, "Админ-пароль должен быть не короче 4 символов"),
    adminPasswordConfirm: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "Пароли не совпадают",
    path: ["passwordConfirm"],
  })
  .refine((value) => value.adminPassword === value.adminPasswordConfirm, {
    message: "Админ-пароли не совпадают",
    path: ["adminPasswordConfirm"],
  });

export function SetupScreen({
  onComplete,
}: {
  onComplete: (user: SessionUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = setupSchema.safeParse({
      email,
      nickname,
      password,
      passwordConfirm,
      adminPassword,
      adminPasswordConfirm,
    });
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }

    setBusy(true);
    const result = await bootstrapAccount(parsed.data);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Аккаунт владельца создан");
    onComplete(result.data);
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

      <div className="glow-neon relative w-full max-w-lg rounded-2xl border border-border/70 bg-card/85 p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="gradient-neon flex size-14 items-center justify-center rounded-2xl text-background">
            <ShieldCheck className="size-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Первичная настройка
            </h1>
            <p className="text-sm text-muted-foreground">
              Создайте аккаунт владельца и задайте админ-пароль
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="size-4 text-primary" />
              Аккаунт владельца
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="setup-email"
                className="text-xs font-medium text-muted-foreground"
              >
                Логин (почта)
              </label>
              <Input
                id="setup-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@project.ru"
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="setup-nickname"
                className="text-xs font-medium text-muted-foreground"
              >
                Ник владельца
              </label>
              <Input
                id="setup-nickname"
                type="text"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Owner"
                autoComplete="nickname"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="setup-password"
                className="text-xs font-medium text-muted-foreground"
              >
                Пароль для входа
              </label>
              <Input
                id="setup-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="setup-password-confirm"
                className="text-xs font-medium text-muted-foreground"
              >
                Повторите пароль для входа
              </label>
              <Input
                id="setup-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 text-primary" />
              Админ-пароль
            </div>
            <p className="text-xs text-muted-foreground">
              Открывает режим редактирования и админ-настройки. Храните его в
              тайне — только владелец им пользуется.
            </p>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="setup-admin-password"
                className="text-xs font-medium text-muted-foreground"
              >
                Админ-пароль
              </label>
              <Input
                id="setup-admin-password"
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="setup-admin-password-confirm"
                className="text-xs font-medium text-muted-foreground"
              >
                Повторите админ-пароль
              </label>
              <Input
                id="setup-admin-password-confirm"
                type="password"
                value={adminPasswordConfirm}
                onChange={(event) =>
                  setAdminPasswordConfirm(event.target.value)
                }
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            disabled={busy}
          >
            Создать аккаунт владельца
          </Button>
        </form>
      </div>
    </div>
  );
}
