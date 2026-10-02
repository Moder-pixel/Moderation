"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Save, ShoppingBag, X } from "lucide-react";
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
  addShopItem,
  updateShopItem,
  type ShopItem,
} from "@/lib/points/points-store";

const shopItemSchema = z.object({
  name: z.string().trim().min(2, "Название товара слишком короткое"),
  cost: z
    .string()
    .refine(
      (value) => /^\d+$/.test(value.trim()) && Number(value.trim()) >= 1,
      {
        message: "Стоимость должна быть целым числом от 1",
      }
    )
    .transform((value) => Number(value.trim())),
  description: z.string(),
});

type ShopItemForm = {
  name: string;
  cost: string;
  description: string;
};

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

export function ShopItemDialog({
  initial,
  onClose,
}: {
  initial: ShopItem | null;
  onClose: () => void;
}) {
  const isEditing = initial !== null;
  const [form, setForm] = useState<ShopItemForm>(() =>
    initial
      ? {
          name: initial.name,
          cost: String(initial.cost),
          description: initial.description,
        }
      : { name: "", cost: "", description: "" }
  );

  function setField<K extends keyof ShopItemForm>(
    key: K,
    value: ShopItemForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = shopItemSchema.safeParse(form);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }

    const result = initial
      ? updateShopItem(
          initial.id,
          parsed.data.name,
          parsed.data.cost,
          parsed.data.description
        )
      : addShopItem(
          parsed.data.name,
          parsed.data.cost,
          parsed.data.description
        );
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      isEditing ? "Товар магазина обновлён" : "Товар добавлен в магазин"
    );
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
              <ShoppingBag className="size-4 text-primary" />
            )}
            {isEditing ? "Изменить товар" : "Новый товар"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Обновите название, стоимость и описание товара."
              : "Заполните данные товара, который можно купить за баллы."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_10rem]">
            <Field label="Название товара" htmlFor="shop-item-name">
              <Input
                id="shop-item-name"
                type="text"
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="Например, Смена ника"
                autoComplete="off"
              />
            </Field>
            <Field label="Стоимость, баллы" htmlFor="shop-item-cost">
              <Input
                id="shop-item-cost"
                type="number"
                min={1}
                step={1}
                value={form.cost}
                onChange={(event) => setField("cost", event.target.value)}
                placeholder="1000"
                autoComplete="off"
              />
            </Field>
          </div>
          <Field label="Описание" htmlFor="shop-item-description">
            <textarea
              id="shop-item-description"
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={3}
              placeholder="Короткое описание того, что получит модератор."
              autoComplete="off"
              className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
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
