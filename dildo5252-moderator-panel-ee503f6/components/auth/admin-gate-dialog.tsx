"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { verifyAdminPassword } from "@/lib/auth/auth-store";

export function AdminGateDialog({
  open,
  onOpenChange,
  onUnlocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) {
      toast("Введите админ-пароль");
      return;
    }

    setBusy(true);
    const valid = await verifyAdminPassword(password);
    setBusy(false);

    if (!valid) {
      toast.error("Неверный админ-пароль");
      setPassword("");
      return;
    }

    setPassword("");
    toast.success("Режим редактирования включён");
    onUnlocked();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Режим редактирования
          </DialogTitle>
          <DialogDescription>
            Введите админ-пароль, чтобы открыть возможности редактирования и
            админ-настройки.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="admin-password"
              className="text-xs font-medium text-muted-foreground"
            >
              Админ-пароль
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={busy}>
              Открыть режим
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
