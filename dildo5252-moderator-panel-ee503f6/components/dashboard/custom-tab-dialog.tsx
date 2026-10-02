"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
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
  addCustomTab,
  updateCustomTab,
  type CustomTab,
} from "@/lib/tabs/custom-tabs-store";

function generateFormId(): string {
  return crypto.randomUUID();
}

type EntryRow = {
  key: string;
  title: string;
  text: string;
};

type TabForm = {
  name: string;
  description: string;
  entries: EntryRow[];
};

const tabSchema = z.object({
  name: z.string().trim().min(2, "Название вкладки слишком короткое"),
  description: z.string(),
  entries: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      text: z.string(),
    })
  ),
});

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function CustomTabDialog({
  initial,
  onClose,
}: {
  initial: CustomTab | null;
  onClose: () => void;
}) {
  const isEditing = initial !== null;
  const [form, setForm] = useState<TabForm>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description,
          entries: initial.entries.map((entry) => ({
            key: entry.id,
            title: entry.title,
            text: entry.text,
          })),
        }
      : {
          name: "",
          description: "",
          entries: [],
        }
  );

  function setField<K extends keyof TabForm>(key: K, value: TabForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setEntry(key: string, patch: Partial<EntryRow>) {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.key === key ? { ...entry, ...patch } : entry
      ),
    }));
  }

  function addEntryRow() {
    setForm((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        { key: generateFormId(), title: "", text: "" },
      ],
    }));
  }

  function removeEntryRow(key: string) {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.key !== key),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = tabSchema.safeParse(form);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }

    const payload = {
      name: parsed.data.name,
      description: parsed.data.description,
      entries: parsed.data.entries
        .filter(
          (entry) =>
            entry.title.trim().length > 0 || entry.text.trim().length > 0
        )
        .map((entry) => ({
          title: entry.title.trim(),
          text: entry.text.trim(),
        })),
    };

    const result = initial
      ? updateCustomTab(initial.id, payload)
      : addCustomTab(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Вкладка обновлена" : "Новая вкладка добавлена");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Pencil className="size-4 text-primary" />
            ) : (
              <Plus className="size-4 text-primary" />
            )}
            {isEditing ? "Изменить вкладку" : "Новая вкладка"}
          </DialogTitle>
          <DialogDescription>
            Задайте название и содержимое вкладки. Внутри можно будет добавлять
            новые записи.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Название вкладки" htmlFor="custom-tab-name">
            <Input
              id="custom-tab-name"
              type="text"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Например, Расписание смен"
              autoComplete="off"
            />
          </Field>
          <Field label="Описание" htmlFor="custom-tab-description">
            <textarea
              id="custom-tab-description"
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={2}
              placeholder="Короткое описание содержимого вкладки"
              autoComplete="off"
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Содержимое (записи)
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addEntryRow}
              >
                <Plus data-icon="inline-start" />
                Добавить запись
              </Button>
            </div>

            {form.entries.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/50 px-3 py-4 text-center text-xs text-muted-foreground">
                Записей пока нет. Нажмите «Добавить запись» или создайте их
                позже прямо на вкладке.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {form.entries.map((entry, index) => (
                  <div
                    key={entry.key}
                    className="rounded-lg border border-border/60 bg-background/60 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Запись {index + 1}
                      </span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Удалить запись ${index + 1}`}
                        onClick={() => removeEntryRow(entry.key)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Field
                        label="Заголовок"
                        htmlFor={`custom-tab-entry-title-${entry.key}`}
                      >
                        <Input
                          id={`custom-tab-entry-title-${entry.key}`}
                          type="text"
                          value={entry.title}
                          onChange={(event) =>
                            setEntry(entry.key, {
                              title: event.target.value,
                            })
                          }
                          placeholder="Заголовок записи"
                          autoComplete="off"
                        />
                      </Field>
                      <Field
                        label="Текст"
                        htmlFor={`custom-tab-entry-text-${entry.key}`}
                      >
                        <textarea
                          id={`custom-tab-entry-text-${entry.key}`}
                          value={entry.text}
                          onChange={(event) =>
                            setEntry(entry.key, {
                              text: event.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Текст записи"
                          autoComplete="off"
                          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
