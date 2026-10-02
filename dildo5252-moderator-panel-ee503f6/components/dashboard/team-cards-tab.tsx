"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CircleCheck,
  Gavel,
  Palmtree,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

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
import { TeamMemberDialog } from "@/components/dashboard/team-member-dialog";
import { RankBadge } from "@/components/dashboard/rank-badge";
import { NicknameText } from "@/components/dashboard/nickname-text";
import {
  getTeamMembersSnapshot,
  getTeamServerSnapshot,
  removeTeamMember,
  subscribeTeamStore,
  type TeamMember,
} from "@/lib/team/team-store";

type EditorState =
  | { type: "add" }
  | { type: "edit"; member: TeamMember }
  | null;

function formatJoinedAt(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function VacationBadge({ onVacation }: { onVacation: boolean }) {
  return onVacation ? (
    <Badge className="bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/30">
      <Palmtree />В отпуске
    </Badge>
  ) : (
    <Badge className="bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30">
      <CircleCheck />
      Не в отпуске
    </Badge>
  );
}

export function TeamCardsTab({ canEdit }: { canEdit: boolean }) {
  const members = useSyncExternalStore(
    subscribeTeamStore,
    getTeamMembersSnapshot,
    getTeamServerSnapshot
  );
  const [editor, setEditor] = useState<EditorState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleRemove(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const result = removeTeamMember(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Модератор удалён из команды");
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">
            Карточки модераторов
          </h2>
          <p className="text-xs text-muted-foreground">
            Ник, должность, дата вступления, выданные наказания и статус
            отпуска.
          </p>
        </div>
        {canEdit ? (
          <Button size="sm" onClick={() => setEditor({ type: "add" })}>
            <Plus data-icon="inline-start" />
            Добавить модератора
          </Button>
        ) : null}
      </header>

      {members.length === 0 ? (
        <Empty className="h-full rounded-xl border border-dashed border-border/50 bg-card/40 py-14">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-14 rounded-full bg-primary/10 text-primary"
            >
              <Users className="size-7" />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold tracking-tight">
              Модераторов пока нет
            </EmptyTitle>
            <EmptyDescription className="max-w-md">
              {canEdit
                ? "Добавьте первого модератора, чтобы заполнить карточки команды."
                : "Карточки появятся здесь после добавления модераторов администрацией."}
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
                Добавить модератора
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="card-hover">
              <CardHeader>
                <CardTitle className="truncate">
                  <NicknameText
                    nickname={member.nickname}
                    gradient={member.nicknameGradient}
                    className="truncate"
                  />
                </CardTitle>
                {canEdit ? (
                  <CardAction>
                    <div className="flex items-center gap-1.5">
                      {confirmDeleteId === member.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemove(member.id)}
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
                            aria-label={`Изменить ${member.nickname}`}
                            onClick={() => setEditor({ type: "edit", member })}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Удалить ${member.nickname}`}
                            onClick={() => handleRemove(member.id)}
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <RankBadge position={member.position} className="self-start" />
                <div className="flex flex-col gap-1.5 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="size-4" />В составе с{" "}
                    {formatJoinedAt(member.joinedAt)}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Gavel className="size-4" />
                    Выдано наказаний: {member.punishments}
                  </span>
                </div>
                <VacationBadge onVacation={member.onVacation} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editor ? (
        <TeamMemberDialog
          initial={editor.type === "edit" ? editor.member : null}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </div>
  );
}
