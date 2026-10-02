"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Save, UserPlus, X } from "lucide-react";
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
import { GradientPicker } from "@/components/dashboard/gradient-picker";
import { NICKNAME_GRADIENTS, POSITIONS } from "@/lib/data";
import {
  addTeamMember,
  updateTeamMember,
  type TeamMember,
} from "@/lib/team/team-store";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function normalizeVkUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const memberSchema = z
  .object({
    nickname: z.string().trim().min(2, "Ник слишком короткий"),
    position: z.enum(POSITIONS, "Выберите должность"),
    joinedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату вступления"),
    punishments: z
      .string()
      .refine((value) => /^\d+$/.test(value.trim()), {
        message: "Число наказаний должно быть целым и неотрицательным",
      })
      .transform((value) => Number(value.trim())),
    onVacation: z.boolean(),
    vkUrl: z.string(),
    nicknameGradient: z
      .string()
      .refine(
        (value) =>
          value === "" ||
          NICKNAME_GRADIENTS.some((gradient) => gradient.id === value),
        { message: "Неизвестная подсветка ника" }
      ),
  })
  .refine(
    (value) => {
      const normalized = normalizeVkUrl(value.vkUrl);
      return normalized.length > 0 && isValidHttpUrl(normalized);
    },
    { message: "Укажите корректную ссылку на ВК", path: ["vkUrl"] }
  );

type MemberForm = {
  nickname: string;
  position: string;
  joinedAt: string;
  punishments: string;
  onVacation: boolean;
  vkUrl: string;
  nicknameGradient: string;
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

export function TeamMemberDialog({
  initial,
  onClose,
}: {
  initial: TeamMember | null;
  onClose: () => void;
}) {
  const isEditing = initial !== null;
  const [form, setForm] = useState<MemberForm>(() =>
    initial
      ? {
          nickname: initial.nickname,
          position: initial.position,
          joinedAt: initial.joinedAt,
          punishments: String(initial.punishments),
          onVacation: initial.onVacation,
          vkUrl: initial.vkUrl,
          nicknameGradient: initial.nicknameGradient ?? "",
        }
      : {
          nickname: "",
          position: "",
          joinedAt: "",
          punishments: "0",
          onVacation: false,
          vkUrl: "",
          nicknameGradient: "",
        }
  );

  function setField<K extends keyof MemberForm>(key: K, value: MemberForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = memberSchema.safeParse(form);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }

    const payload = {
      nickname: parsed.data.nickname,
      position: parsed.data.position,
      joinedAt: parsed.data.joinedAt,
      punishments: parsed.data.punishments,
      onVacation: parsed.data.onVacation,
      vkUrl: normalizeVkUrl(parsed.data.vkUrl),
      nicknameGradient: parsed.data.nicknameGradient || null,
    };

    const result = initial
      ? await updateTeamMember(initial.id, payload)
      : await addTeamMember(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      isEditing ? "Данные модератора обновлены" : "Модератор добавлен в команду"
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
              <UserPlus className="size-4 text-primary" />
            )}
            {isEditing ? "Изменить модератора" : "Новый модератор"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Обновите данные модератора и сохраните изменения."
              : "Заполните данные модератора, чтобы добавить его в команду."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ник" htmlFor="member-nickname">
              <Input
                id="member-nickname"
                type="text"
                value={form.nickname}
                onChange={(event) => setField("nickname", event.target.value)}
                placeholder="Nickname"
                autoComplete="off"
              />
            </Field>
            <Field label="Должность" htmlFor="member-position">
              <select
                id="member-position"
                value={form.position}
                onChange={(event) => setField("position", event.target.value)}
                className={selectClass}
              >
                <option value="" disabled>
                  Выберите должность
                </option>
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Дата вступления" htmlFor="member-joined-at">
              <Input
                id="member-joined-at"
                type="date"
                value={form.joinedAt}
                onChange={(event) => setField("joinedAt", event.target.value)}
              />
            </Field>
            <Field label="Выдано наказаний" htmlFor="member-punishments">
              <Input
                id="member-punishments"
                type="number"
                min={0}
                step={1}
                value={form.punishments}
                onChange={(event) =>
                  setField("punishments", event.target.value)
                }
                placeholder="0"
              />
            </Field>
          </div>
          <Field label="Ссылка на ВК" htmlFor="member-vk-url">
            <Input
              id="member-vk-url"
              type="text"
              value={form.vkUrl}
              onChange={(event) => setField("vkUrl", event.target.value)}
              placeholder="https://vk.com/username"
              autoComplete="off"
            />
          </Field>
          <GradientPicker
            value={form.nicknameGradient}
            onChange={(value) => setField("nicknameGradient", value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.onVacation}
              onChange={(event) => setField("onVacation", event.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            В отпуске
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
