"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coins, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { setMemberPoints } from "@/lib/points/points-store";

export function MemberPointsDialog({
  memberId,
  nickname,
  initialPoints,
  onClose,
}: {
  memberId: string;
  nickname: string;
  initialPoints: number;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(initialPoints));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(value.trim());
    const result = setMemberPoints(memberId, parsed);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Баллы модератора «${nickname}» обновлены`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="size-4 text-primary" />
            Баллы модератора
          </DialogTitle>
          <DialogDescription>
            Модератор «{nickname}». Укажите текущее количество баллов.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="member-points" className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Количество баллов
            </span>
            <Input
              id="member-points"
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
