"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  KeyRound,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  addModerator,
  changeAdminPassword,
  listUsers,
  removeUser,
  updateUser,
  type UserListItem,
} from "@/lib/auth/auth-store";

const addSchema = z.object({
  email: z.email("Введите корректную почту"),
  nickname: z.string().trim().min(2, "Ник слишком короткий"),
  password: z.string().min(4, "Пароль должен быть не короче 4 символов"),
});

const editSchema = z
  .object({
    email: z.email("Введите корректную почту"),
    nickname: z.string().trim().min(2, "Ник слишком короткий"),
    password: z.string().optional(),
  })
  .refine((value) => !value.password || value.password.length >= 4, {
    message: "Новый пароль должен быть не короче 4 символов",
    path: ["password"],
  });

const adminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий админ-пароль"),
    newPassword: z
      .string()
      .min(4, "Новый админ-пароль должен быть не короче 4 символов"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Админ-пароли не совпадают",
    path: ["confirmPassword"],
  });

const emptyAddForm = { email: "", nickname: "", password: "" };
const emptyEditForm = { email: "", nickname: "", password: "" };
const emptyAdminForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
}

export function AdminSettingsDialog({ onClose }: { onClose: () => void }) {
  const [moderators, setModerators] = useState<UserListItem[]>(() =>
    listUsers().filter((user) => user.role === "moderator")
  );
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);

  function refresh() {
    setModerators(listUsers().filter((user) => user.role === "moderator"));
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = addSchema.safeParse(addForm);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }
    const result = await addModerator(parsed.data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Учётная запись модератора добавлена");
    setAddForm(emptyAddForm);
    refresh();
  }

  function startEdit(user: UserListItem) {
    setEditingId(user.id);
    setEditForm({
      email: user.email,
      nickname: user.nickname,
      password: "",
    });
    setConfirmDeleteId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyEditForm);
  }

  async function handleEditSave() {
    if (!editingId) return;
    const parsed = editSchema.safeParse(editForm);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }
    const payload = {
      email: parsed.data.email,
      nickname: parsed.data.nickname,
      ...(parsed.data.password ? { password: parsed.data.password } : {}),
    };
    const result = await updateUser(editingId, payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Учётная запись обновлена");
    cancelEdit();
    refresh();
  }

  function handleRemove(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const result = removeUser(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Учётная запись удалена");
    setConfirmDeleteId(null);
    refresh();
  }

  async function handleAdminPasswordChange(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    const parsed = adminPasswordSchema.safeParse(adminForm);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Проверьте введённые данные");
      return;
    }
    const result = await changeAdminPassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Админ-пароль изменён");
    setAdminForm(emptyAdminForm);
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            Админ-настройки
          </DialogTitle>
          <DialogDescription>
            Выдавайте и отзывайте учётные записи модераторов, меняйте их данные
            и админ-пароль.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-6 overflow-y-auto pr-1">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4 text-primary" />
              Учётные записи модераторов
            </div>

            {moderators.length === 0 ? (
              <Empty className="rounded-lg border border-dashed border-border/50 py-8">
                <EmptyHeader>
                  <EmptyMedia
                    variant="icon"
                    className="size-10 rounded-full bg-primary/10 text-primary"
                  >
                    <Users className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>Модераторов пока нет</EmptyTitle>
                  <EmptyDescription>
                    Добавьте первую учётную запись модератора ниже.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent />
              </Empty>
            ) : (
              <ul className="flex flex-col gap-2">
                {moderators.map((moderator) =>
                  editingId === moderator.id ? (
                    <li
                      key={moderator.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-3"
                    >
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor={`edit-email-${moderator.id}`}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Логин (почта)
                        </label>
                        <Input
                          id={`edit-email-${moderator.id}`}
                          type="email"
                          value={editForm.email}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              email: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor={`edit-nickname-${moderator.id}`}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Ник
                        </label>
                        <Input
                          id={`edit-nickname-${moderator.id}`}
                          type="text"
                          value={editForm.nickname}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              nickname: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor={`edit-password-${moderator.id}`}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Новый пароль (необязательно)
                        </label>
                        <Input
                          id={`edit-password-${moderator.id}`}
                          type="password"
                          value={editForm.password}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              password: event.target.value,
                            }))
                          }
                          placeholder="Оставьте пустым, чтобы не менять"
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X data-icon="inline-start" />
                          Отмена
                        </Button>
                        <Button size="sm" onClick={handleEditSave}>
                          <Save data-icon="inline-start" />
                          Сохранить
                        </Button>
                      </div>
                    </li>
                  ) : (
                    <li
                      key={moderator.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3"
                    >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {moderator.nickname}
                          </span>
                          <Badge variant="outline">модератор</Badge>
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          {moderator.email} · с{" "}
                          {formatDate(moderator.createdAt)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {confirmDeleteId === moderator.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemove(moderator.id)}
                            >
                              <Trash2 data-icon="inline-start" />
                              Удалить
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Отмена
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Изменить ${moderator.nickname}`}
                              onClick={() => startEdit(moderator)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Удалить ${moderator.nickname}`}
                              onClick={() => handleRemove(moderator.id)}
                            >
                              <Trash2 />
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  )
                )}
              </ul>
            )}

            <form
              onSubmit={handleAdd}
              className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <UserPlus className="size-4" />
                Новая учётная запись
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="new-mod-email"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Логин (почта)
                  </label>
                  <Input
                    id="new-mod-email"
                    type="email"
                    value={addForm.email}
                    onChange={(event) =>
                      setAddForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="moderator@project.ru"
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="new-mod-nickname"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Ник
                  </label>
                  <Input
                    id="new-mod-nickname"
                    type="text"
                    value={addForm.nickname}
                    onChange={(event) =>
                      setAddForm((prev) => ({
                        ...prev,
                        nickname: event.target.value,
                      }))
                    }
                    placeholder="Nickname"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="new-mod-password"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Пароль
                </label>
                <Input
                  id="new-mod-password"
                  type="password"
                  value={addForm.password}
                  onChange={(event) =>
                    setAddForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" size="sm" className="self-end">
                <Plus data-icon="inline-start" />
                Добавить модератора
              </Button>
            </form>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 text-primary" />
              Смена админ-пароля
            </div>
            <form
              onSubmit={handleAdminPasswordChange}
              className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3"
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="admin-current-password"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Текущий админ-пароль
                </label>
                <Input
                  id="admin-current-password"
                  type="password"
                  value={adminForm.currentPassword}
                  onChange={(event) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                  autoComplete="current-password"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="admin-new-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Новый админ-пароль
                  </label>
                  <Input
                    id="admin-new-password"
                    type="password"
                    value={adminForm.newPassword}
                    onChange={(event) =>
                      setAdminForm((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="admin-confirm-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Повторите новый админ-пароль
                  </label>
                  <Input
                    id="admin-confirm-password"
                    type="password"
                    value={adminForm.confirmPassword}
                    onChange={(event) =>
                      setAdminForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="self-end">
                <KeyRound data-icon="inline-start" />
                Сменить админ-пароль
              </Button>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
