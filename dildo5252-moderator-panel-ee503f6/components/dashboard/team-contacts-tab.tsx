"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  AtSign,
  ContactRound,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
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

export function TeamContactsTab({ canEdit }: { canEdit: boolean }) {
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
            Контакты модераторов
          </h2>
          <p className="text-xs text-muted-foreground">
            Ник, должность и кликабельная ссылка на ВК каждого модератора.
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
              <ContactRound className="size-7" />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold tracking-tight">
              Контактов пока нет
            </EmptyTitle>
            <EmptyDescription className="max-w-md">
              {canEdit
                ? "Добавьте первого модератора, чтобы заполнить список контактов."
                : "Контакты появятся здесь после добавления модераторов администрацией."}
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
        <ul className="flex flex-col rounded-xl border border-border/60 bg-card/40">
          {members.map((member, index) => (
            <li key={member.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="gradient-neon flex size-9 shrink-0 items-center justify-center rounded-lg text-background">
                    <AtSign className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium">
                      <NicknameText
                        nickname={member.nickname}
                        gradient={member.nicknameGradient}
                        className="truncate"
                      />
                    </span>
                    <RankBadge position={member.position} className="w-fit" />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <a
                    href={member.vkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    ВКонтакте
                    <ExternalLink className="size-4" />
                  </a>
                  {canEdit ? (
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
                  ) : null}
                </div>
              </div>
              {index < members.length - 1 ? <Separator /> : null}
            </li>
          ))}
        </ul>
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
