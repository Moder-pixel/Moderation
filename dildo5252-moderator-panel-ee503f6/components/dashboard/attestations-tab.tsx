"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Check, Pencil, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { RankBadge } from "@/components/dashboard/rank-badge";
import { NicknameText } from "@/components/dashboard/nickname-text";
import { TeamMemberDialog } from "@/components/dashboard/team-member-dialog";
import {
  getTeamMembersSnapshot,
  getTeamServerSnapshot,
  subscribeTeamStore,
  type TeamMember,
} from "@/lib/team/team-store";
import {
  getAttestationSnapshot,
  getAttestationServerSnapshot,
  subscribeAttestationStore,
  toggleAttestation,
  type AttestationKey,
} from "@/lib/attestations/attestation-store";

type AttestationColumn = {
  key: AttestationKey;
  label: string;
  fullLabel: string;
};

const ATTESTATION_COLUMNS: AttestationColumn[] = [
  {
    key: "rules",
    label: "Правила",
    fullLabel: "Аттестация по правилам",
  },
  {
    key: "communication",
    label: "Общение с игроками",
    fullLabel: "Аттестация по общению с игроками",
  },
  {
    key: "cheatChecks",
    label: "Проверки на читы",
    fullLabel: "Аттестация по проверкам на читы",
  },
  {
    key: "deepCheatChecks",
    label: "Углублённая по читам",
    fullLabel: "Углублённая аттестация по проверкам на читы",
  },
];

export function AttestationsTab({ canEdit }: { canEdit: boolean }) {
  const members = useSyncExternalStore(
    subscribeTeamStore,
    getTeamMembersSnapshot,
    getTeamServerSnapshot
  );
  const attestations = useSyncExternalStore(
    subscribeAttestationStore,
    getAttestationSnapshot,
    getAttestationServerSnapshot
  );
  const [memberEditor, setMemberEditor] = useState<TeamMember | null>(null);

  function handleToggle(memberId: string, key: AttestationKey) {
    const result = toggleAttestation(memberId, key);
    if (!result.ok) {
      toast.error(result.error);
    }
  }

  if (members.length === 0) {
    return (
      <div className="flex h-full flex-col p-5">
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
              Добавьте модераторов в разделе «Команда», чтобы вести таблицу
              аттестаций.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">Аттестации</h2>
          <p className="text-xs text-muted-foreground">
            Галочка — аттестация сдана, пустой квадрат — не сдана.{" "}
            {canEdit
              ? "Клик по квадрату ставит или убирает галочку."
              : "Отметки меняет только администрация."}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="flex size-3 items-center justify-center rounded-sm border border-primary/60 bg-primary/15 text-primary">
            <Check className="size-2.5" strokeWidth={3} />
          </span>
          Аттестация сдана
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-sm border border-border/70 bg-muted/60" />
          Аттестация не сдана
        </span>
      </div>

      <div className="min-w-0 flex-1 overflow-auto rounded-xl border border-border/60 bg-card/40">
        <table className="w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-10 w-48 border-b border-border/60 bg-card px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                scope="col"
              >
                Модератор
              </th>
              {ATTESTATION_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-border/60 bg-card px-3 py-3 text-center"
                  scope="col"
                  title={column.fullLabel}
                >
                  <span className="text-xs font-medium">{column.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const entry = attestations.entries[member.id];
              return (
                <tr key={member.id}>
                  <td className="sticky left-0 z-10 border-b border-r border-border/60 bg-card px-4 py-2.5">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-medium">
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
                      {canEdit ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Изменить модератора ${member.nickname}`}
                          onClick={() => setMemberEditor(member)}
                        >
                          <Pencil />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                  {ATTESTATION_COLUMNS.map((column) => {
                    const passed = entry?.[column.key] ?? false;
                    return (
                      <td
                        key={column.key}
                        className="border-b border-l border-border/60 px-3 py-2 text-center"
                      >
                        <button
                          type="button"
                          disabled={!canEdit}
                          title={
                            canEdit
                              ? `${column.fullLabel}: ${
                                  passed ? "сдана" : "не сдана"
                                } — клик, чтобы ${
                                  passed ? "убрать" : "поставить"
                                } галочку`
                              : `${column.fullLabel}: ${
                                  passed ? "сдана" : "не сдана"
                                }`
                          }
                          aria-label={`${member.nickname}, ${
                            column.fullLabel
                          }: ${passed ? "сдана" : "не сдана"}`}
                          aria-pressed={passed}
                          onClick={() => handleToggle(member.id, column.key)}
                          className={cn(
                            "mx-auto flex size-8 items-center justify-center rounded-md border transition-all duration-200",
                            passed
                              ? "border-primary/60 bg-primary/15 text-primary"
                              : "border-border/70 bg-muted/60 text-transparent",
                            canEdit &&
                              "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-ring/50 active:scale-95",
                            !canEdit && "cursor-default"
                          )}
                        >
                          <Check className="size-5" strokeWidth={3} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {memberEditor ? (
        <TeamMemberDialog
          initial={memberEditor}
          onClose={() => setMemberEditor(null)}
        />
      ) : null}
    </div>
  );
}
