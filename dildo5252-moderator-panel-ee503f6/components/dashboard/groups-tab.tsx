"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Crown, Network, Pencil, Plus, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { GroupDialog } from "@/components/dashboard/group-dialog";
import { RankBadge } from "@/components/dashboard/rank-badge";
import { NicknameText } from "@/components/dashboard/nickname-text";
import {
  getGroupsServerSnapshot,
  getGroupsSnapshot,
  removeGroup,
  subscribeGroupsStore,
  type ModeratorGroup,
} from "@/lib/groups/groups-store";

type EditorState =
  | { type: "add" }
  | { type: "edit"; group: ModeratorGroup }
  | null;

function initialsOf(nickname: string): string {
  const trimmed = nickname.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function GroupsTab({ canEdit }: { canEdit: boolean }) {
  const groups = useSyncExternalStore(
    subscribeGroupsStore,
    getGroupsSnapshot,
    getGroupsServerSnapshot
  );
  const [editor, setEditor] = useState<EditorState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleRemove(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const result = removeGroup(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Группа удалена с вкладки");
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">
            Группы модераторов
          </h2>
          <p className="text-xs text-muted-foreground">
            Три группы с лидерами и составом. Лидеры выделены визуально.
          </p>
        </div>
        {canEdit ? (
          <Button size="sm" onClick={() => setEditor({ type: "add" })}>
            <Plus data-icon="inline-start" />
            Добавить группу
          </Button>
        ) : null}
      </header>

      {groups.length === 0 ? (
        <Empty className="h-full rounded-xl border border-dashed border-border/50 bg-card/40 py-14">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-14 rounded-full bg-primary/10 text-primary"
            >
              <Network className="size-7" />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold tracking-tight">
              Групп пока нет
            </EmptyTitle>
            <EmptyDescription className="max-w-md">
              {canEdit
                ? "Добавьте первую группу с лидером и составом модераторов."
                : "Группы появятся здесь после добавления их администрацией."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {canEdit ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditor({ type: "add" })}
              >
                <Plus data-icon="inline-start" />
                Добавить группу
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="card-hover">
              <CardHeader>
                <CardTitle className="truncate">{group.name}</CardTitle>
                {canEdit ? (
                  <CardAction>
                    <div className="flex items-center gap-1.5">
                      {confirmDeleteId === group.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemove(group.id)}
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
                            aria-label={`Изменить группу ${group.name}`}
                            onClick={() => setEditor({ type: "edit", group })}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Удалить группу ${group.name}`}
                            onClick={() => handleRemove(group.id)}
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 p-3 ring-1 ring-primary/20">
                  <div className="gradient-neon flex size-10 shrink-0 items-center justify-center rounded-full text-background">
                    <Crown className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold">
                        <NicknameText
                          nickname={group.leader.nickname}
                          gradient={group.leader.nicknameGradient}
                          className="truncate"
                        />
                      </span>
                      <Badge className="bg-primary/20 text-primary ring-1 ring-primary/30">
                        Лидер
                      </Badge>
                    </div>
                    <RankBadge position={group.leader.position} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Users className="size-3.5" />
                    Модераторы в подчинении
                    <Badge variant="secondary">{group.members.length}</Badge>
                  </div>
                  {group.members.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/50 px-3 py-4 text-center text-xs text-muted-foreground">
                      В группе нет модераторов в подчинении
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {group.members.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {initialsOf(member.nickname)}
                          </span>
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate text-sm font-medium">
                              <NicknameText
                                nickname={member.nickname}
                                gradient={member.nicknameGradient}
                                className="truncate"
                              />
                            </span>
                            <RankBadge
                              position={member.position}
                              className="w-fit"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editor ? (
        <GroupDialog
          initial={editor.type === "edit" ? editor.group : null}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </div>
  );
}
