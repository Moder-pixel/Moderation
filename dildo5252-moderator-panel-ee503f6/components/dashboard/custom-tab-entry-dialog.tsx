"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ListPlus, Pencil, Save, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  addCustomTabEntry,
  updateCustomTabEntry,
  type CustomTabEntry,
} from "@/lib/tabs/custom-tabs-store";

const entrySchema = z.object({
  title: z.string().trim(),
  text: z.string().trim(),
});

export function CustomTabEntryDialog({
  tabId,
  initial,
  onClose,
}: {
  tabId: string;
  initial: CustomTabEntry | null;
  onClose: () => void;
}) {
  const isEditing = initial !== null;
  const [form, setForm] = useState(() => ({
    title: initial?.title ?? "",
    text: initial?.text ?? "",
  }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = entrySchema.safeParse(form);
    if (!parsed.success) {
      toast("Проверьте введённые данные");
      return;
    }
    if (parsed.data.title.length < 1 && parsed.data.text.length < 1) {
      toast("Запись не может быть пустой");
      return;
    }

    const result = initial
      ? updateCustomTabEntry(tabId, initial.id, parsed.data)
      : addCustomTabEntry(tabId, parsed.data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Запись обновлена" : "Запись добавлена");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Pencil className="size-4 text-primary" />
            ) : (
              <ListPlus className="size-4 text-primary" />
            )}
            {isEditing ? "Изменить запись" : "Новая запись"}
          </DialogTitle>
          <DialogDescription>
            Добавьте строку с заголовком и текстом на вкладку.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="custom-entry-title" className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Заголовок
            </span>
            <Input
              id="custom-entry-title"
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Заголовок записи"
              autoComplete="off"
            />
          </label>
          <label htmlFor="custom-entry-text" className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Текст
            </span>
            <textarea
              id="custom-entry-text"
              value={form.text}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, text: event.target.value }))
              }
              rows={5}
              placeholder="Текст записи"
              autoComplete="off"
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
