"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resetOwnerSettings } from "@/lib/auth/auth-store";

export const OWNER_RESET_ENABLED = false;

export function OwnerResetButton() {
  const [confirming, setConfirming] = useState(false);

  function handleReset() {
    resetOwnerSettings();
    toast.success(
      "Настройки владельца сброшены. Пройдите первичную настройку заново."
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        <RotateCcw className="size-3.5" />
        Сбросить настройки владельца
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
        Это удалит админ-пароль и все учётные записи, после чего откроется
        первичная настройка владельца.
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="destructive" onClick={handleReset}>
          <RotateCcw data-icon="inline-start" />
          Сбросить
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
