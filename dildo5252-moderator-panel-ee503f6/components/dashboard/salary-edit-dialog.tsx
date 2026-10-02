"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Wallet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateSalary } from "@/lib/points/points-store";

export function SalaryEditDialog({
  position,
  initialPoints,
  onClose,
}: {
  position: string;
  initialPoints: number;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(initialPoints));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(value.trim());
    const result = updateSalary(position, parsed);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Зарплата должности «${position}» обновлена`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            Зарплата должности
          </DialogTitle>
          <DialogDescription>
            Должность «{position}». Укажите размер зарплаты в баллах за месяц.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="salary-points" className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Баллов за месяц
            </span>
            <Input
              id="salary-points"
              type="number"
              min={0}
              step={1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="0"
              autoComplete="off"
            />
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              <X data-icon="inline-start" />
              Отмена
            </Button>
            <Button type="submit">
              <Save data-icon="inline-start" />
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
