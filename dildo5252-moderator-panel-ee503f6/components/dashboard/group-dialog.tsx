"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Save, Trash2, UserPlus, Users, X } from "lucide-react";
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
  addGroup,
  updateGroup,
  type ModeratorGroup,
} from "@/lib/groups/groups-store";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function generateFormId(): string {
  return crypto.randomUUID();
}

type MemberRow = {
  key: string;
  nickname: string;
  position: string;
  gradient: string;
};

type GroupForm = {
  name: string;
  leaderNickname: string;
  leaderPosition: string;
  leaderGradient: string;
  members: MemberRow[];
};

const groupSchema = z.object({
  name: z.string().trim().min(2, "Название группы слишком короткое"),
  leaderNickname: z.string().trim().min(2, "Ник лидера слишком короткий"),
  leaderPosition: z.enum(POSITIONS, "Выберите должность лидера"),
  leaderGradient: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        NICKNAME_GRADIENTS.some((gradient) => gradient.id === value),
      { message: "Неизвестная подсветка ника" }
    ),
  members: z
    .array(
      z.object({
        key: z.string(),
        nickname: z.string().trim().min(2, "Ник модератора слишком короткий"),
        position: z.enum(POSITIONS, "Выберите должность"),
        gradient: z
          .string()
          .refine(
            (value) =>
              value === "" ||
              NICKNAME_GRADIENTS.some((gradient) => gradient.id === value),
            { message: "Неизвестная подсветка ника" }
          ),
      })
    )
    .max(8, "Слишком много модераторов в группе"),
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

export function GroupDialog({
  initial,
  onClose,
}: {
  initial: ModeratorGroup | null;
  onClose: () => void;
}) {
  const isEditing = initial !== null;
  const [form, setForm] = useState<GroupForm>(() =>
    initial
      ? {
          name: initial.name,
          leaderNickname: initial.leader.nickname,
          leaderPosition: initial.leader.position,
          leaderGradient: initial.leader.nicknameGradient ?? "",
          members: initial.members.map((member) => ({
            key: member.id,
            nickname: member.nickname,
            position: member.position,
            gradient: member.nicknameGradient ?? "",
          })),
        }
      : {
          name: "",
          leaderNickname: "",
          leaderPosition: "",
          leaderGradient: "",
          members: [
            { key: generateFormId(), nickname: "", position: "", gradient: "" },
            { key: generateFormId(), nickname: "", position: "", gradient: "" },
            { key: generateFormId(), nickname: "", position: "", gradient: "" },
            { key: generateFormId(), nickname: "", position: "", gradient: "" },
          ],
        }
  );

  function setField<K extends keyof GroupForm>(key: K, value: GroupForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setMember(key: string, patch: Partial<MemberRow>) {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((member) =>
        member.key === key ? { ...member, ...patch } : member
      ),
    }));
  }

  function addMemberRow() {
    setForm((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        { key: generateFormId(), nickname: "", position: "", gradient: "" },
      ],
    }));
  }

  function removeMemberRow(key: string) {
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((member) => member.key !== key),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = groupSchema.safeParse(form);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }

    const payload = {
      name: parsed.data.name,
      leader: {
        nickname: parsed.data.leaderNickname,
        position: parsed.data.leaderPosition,
        nicknameGradient: parsed.data.leaderGradient || null,
      },
      members: parsed.data.members.map((member) => ({
        nickname: member.nickname,
        position: member.position,
        nicknameGradient: member.gradient || null,
      })),
    };

    const result = initial
      ? updateGroup(initial.id, payload)
      : addGroup(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      isEditing ? "Группа обновлена" : "Группа добавлена на вкладку"
    );
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
              <Users className="size-4 text-primary" />
            )}
            {isEditing ? "Изменить группу" : "Новая группа"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Обновите название, лидера и состав группы."
              : "Заполните название, лидера и состав новой группы."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Название группы" htmlFor="group-name">
            <Input
              id="group-name"
              type="text"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Например, Отряд «Грифон»"
              autoComplete="off"
            />
          </Field>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
              <UserPlus className="size-3.5" />
              Лидер группы
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Ник лидера" htmlFor="group-leader-nickname">
                <Input
                  id="group-leader-nickname"
                  type="text"
                  value={form.leaderNickname}
                  onChange={(event) =>
                    setField("leaderNickname", event.target.value)
                  }
                  placeholder="Nickname"
                  autoComplete="off"
                />
              </Field>
              <Field label="Должность лидера" htmlFor="group-leader-position">
                <select
                  id="group-leader-position"
                  value={form.leaderPosition}
                  onChange={(event) =>
                    setField("leaderPosition", event.target.value)
                  }
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
            </div>
            <div className="mt-3">
              <GradientPicker
                value={form.leaderGradient}
                onChange={(value) => setField("leaderGradient", value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Users className="size-3.5" />
                Модераторы в подчинении
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addMemberRow}
              >
                <Plus data-icon="inline-start" />
                Добавить
              </Button>
            </div>

            {form.members.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/50 px-3 py-4 text-center text-xs text-muted-foreground">
                В группе пока нет модераторов. Нажмите «Добавить».
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {form.members.map((member, index) => (
                  <div
                    key={member.key}
                    className="rounded-lg border border-border/60 bg-background/60 p-3"
                  >
                    <div className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2">
                      <span className="flex h-10 items-center text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                      <Field
                        label="Ник"
                        htmlFor={`group-member-nick-${member.key}`}
                      >
                        <Input
                          id={`group-member-nick-${member.key}`}
                          type="text"
                          value={member.nickname}
                          onChange={(event) =>
                            setMember(member.key, {
                              nickname: event.target.value,
                            })
                          }
                          placeholder="Nickname"
                          autoComplete="off"
                        />
                      </Field>
                      <Field
                        label="Должность"
                        htmlFor={`group-member-position-${member.key}`}
                      >
                        <select
                          id={`group-member-position-${member.key}`}
                          value={member.position}
                          onChange={(event) =>
                            setMember(member.key, {
                              position: event.target.value,
                            })
                          }
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
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Удалить модератора ${index + 1}`}
                        onClick={() => removeMemberRow(member.key)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-3">
                      <GradientPicker
                        value={member.gradient}
                        onChange={(value) =>
                          setMember(member.key, { gradient: value })
                        }
                      />
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
