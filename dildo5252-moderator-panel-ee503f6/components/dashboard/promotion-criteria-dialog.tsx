"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BookMarked, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setPromotionCriteria } from "@/lib/rules/rules-store";

export function PromotionCriteriaDialog({
  initialText,
  onClose,
}: {
  initialText: string;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialText);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = setPromotionCriteria(value);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Критерии повышения обновлены");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="size-4 text-primary" />
            Критерии повышения
          </DialogTitle>
          <DialogDescription>
            Дополните раздел текстом о критериях повышения. Каждая строка станет
            отдельным абзацем.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label
            htmlFor="promotion-criteria-text"
            className="flex flex-col gap-2"
          >
            <span className="text-xs font-medium text-muted-foreground">
              Текст раздела
            </span>
            <textarea
              id="promotion-criteria-text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              rows={12}
              placeholder={
                "Например:\nАктивная игра на сервере не менее 3 месяцев.\nОтсутствие нарушений правил за последний месяц.\nНаличие сданных аттестаций по правилам и общению."
              }
              autoComplete="off"
              className="min-h-40 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
