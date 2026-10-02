"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addWorkDay } from "@/lib/work/work-store";

export function WorkAddDateDialog({ onClose }: { onClose: () => void }) {
  const [date, setDate] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast("Укажите дату в таблице");
      return;
    }
    const result = addWorkDay(date);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Дата добавлена в таблицу выработки");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-4 text-primary" />
            Добавить дату
          </DialogTitle>
          <DialogDescription>
            Новая колонка с прямоугольниками появится в таблице выработки.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="work-add-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              <X data-icon="inline-start" />
              Отмена
            </Button>
            <Button type="submit">
              <Save data-icon="inline-start" />
              Добавить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
