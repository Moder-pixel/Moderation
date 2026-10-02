"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { CalendarRange, Pencil, Plus, Users, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { WorkAddDateDialog } from "@/components/dashboard/work-add-date-dialog";
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
  clearWorkStatus,
  getWorkServerSnapshot,
  getWorkSnapshot,
  removeWorkDay,
  setWorkStatus,
  subscribeWorkStore,
  type WorkStatus,
} from "@/lib/work/work-store";

const STATUS_ORDER: WorkStatus[] = ["done", "failed", "vacation"];

const STATUS_META: Record<
  WorkStatus,
  { label: string; className: string; legendClass: string }
> = {
  done: {
    label: "Норма выполнена",
    className: "bg-emerald-500",
    legendClass: "bg-emerald-500",
  },
  failed: {
    label: "Норма не выполнена",
    className: "bg-red-500",
    legendClass: "bg-red-500",
  },
  vacation: {
    label: "В отпуске",
    className: "bg-sky-500",
    legendClass: "bg-sky-500",
  },
};

const WEEKDAYS = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

function weekdayOf(date: string): string {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

function nextStatus(current: WorkStatus | null): WorkStatus | null {
  if (current === null) return "done";
  const index = STATUS_ORDER.indexOf(current);
  if (index === -1 || index === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[index + 1];
}

export function WorkTab({ canEdit }: { canEdit: boolean }) {
  const members = useSyncExternalStore(
    subscribeTeamStore,
    getTeamMembersSnapshot,
    getTeamServerSnapshot
  );
  const work = useSyncExternalStore(
    subscribeWorkStore,
    getWorkSnapshot,
    getWorkServerSnapshot
  );
  const [addDateOpen, setAddDateOpen] = useState(false);
  const [memberEditor, setMemberEditor] = useState<TeamMember | null>(null);

  function handleCellClick(
    memberId: string,
    date: string,
    status: WorkStatus | null
  ) {
    const next = nextStatus(status);
    const result =
      next === null
        ? clearWorkStatus(memberId, date)
        : setWorkStatus(memberId, date, next);
    if (!result.ok) {
      toast.error(result.error);
    }
  }

  function handleRemoveDay(date: string) {
    const result = removeWorkDay(date);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Дата удалена из таблицы");
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
              выработки по дням месяца.
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
          <h2 className="text-base font-semibold tracking-tight">
            Выработка и нормы
          </h2>
          <p className="text-xs text-muted-foreground">
            Норма выполнена — зелёный, не выполнена — красный, в отпуске —
            синий.
          </p>
        </div>
        {canEdit ? (
          <Button size="sm" onClick={() => setAddDateOpen(true)}>
            <Plus data-icon="inline-start" />
            Добавить дату
          </Button>
        ) : null}
      </header>

      {work.days.length === 0 ? (
        <Empty className="h-full rounded-xl border border-dashed border-border/50 bg-card/40 py-14">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-14 rounded-full bg-primary/10 text-primary"
            >
              <CalendarRange className="size-7" />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold tracking-tight">
              В таблице нет дат
            </EmptyTitle>
            <EmptyDescription className="max-w-md">
              {canEdit
                ? "Добавьте первую дату, чтобы начать отмечать выполнение норм."
                : "Даты появятся здесь после добавления их администрацией."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {canEdit ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddDateOpen(true)}
              >
                <Plus data-icon="inline-start" />
                Добавить дату
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {STATUS_ORDER.map((status) => (
              <span key={status} className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-3 rounded-sm",
                    STATUS_META[status].legendClass
                  )}
                />
                {STATUS_META[status].label}
              </span>
            ))}
            {canEdit ? (
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-sm border border-border/70 bg-muted/60" />
                Не отмечено (клик меняет статус)
              </span>
            ) : null}
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
                  {work.days.map((day) => (
                    <th
                      key={day.date}
                      className="border-b border-border/60 bg-card px-1 py-2"
                      scope="col"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium">{day.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {weekdayOf(day.date)}
                        </span>
                        {canEdit ? (
                          <button
                            type="button"
                            title={`Удалить ${day.label}.${day.date.slice(5, 7)}`}
                            aria-label={`Удалить дату ${day.date}`}
                            onClick={() => handleRemoveDay(day.date)}
                            className="mt-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="size-3" />
                          </button>
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const row = work.entries[member.id] ?? {};
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
                      {work.days.map((day) => {
                        const status = row[day.date] ?? null;
                        const meta = status ? STATUS_META[status] : null;
                        return (
                          <td
                            key={day.date}
                            className="border-b border-l border-border/60 px-1 py-2 text-center"
                          >
                            <button
                              type="button"
                              disabled={!canEdit}
                              title={
                                canEdit
                                  ? meta
                                    ? `${meta.label} — клик, чтобы изменить`
                                    : "Не отмечено — клик, чтобы отметить"
                                  : (meta?.label ?? "Не отмечено")
                              }
                              aria-label={`${member.nickname}, ${
                                day.date
                              }: ${meta?.label ?? "не отмечено"}`}
                              onClick={() =>
                                handleCellClick(member.id, day.date, status)
                              }
                              className={cn(
                                "block size-7 shrink-0 rounded-md border transition-all duration-200",
                                meta
                                  ? meta.className
                                  : "border-border/70 bg-muted/60",
                                canEdit &&
                                  "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-ring/50 active:scale-95",
                                !canEdit && "cursor-default"
                              )}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addDateOpen ? (
        <WorkAddDateDialog onClose={() => setAddDateOpen(false)} />
      ) : null}
      {memberEditor ? (
        <TeamMemberDialog
          initial={memberEditor}
          onClose={() => setMemberEditor(null)}
        />
      ) : null}
    </div>
  );
}
