"use client";

import { useState, useSyncExternalStore } from "react";
import { AlertTriangle, Coins, Pencil, Scale, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MemberPointsDialog } from "@/components/dashboard/member-points-dialog";
import { TeamMemberDialog } from "@/components/dashboard/team-member-dialog";
import { RankBadge } from "@/components/dashboard/rank-badge";
import { NicknameText } from "@/components/dashboard/nickname-text";
import {
  getTeamMembersSnapshot,
  getTeamServerSnapshot,
  subscribeTeamStore,
  type TeamMember,
} from "@/lib/team/team-store";
import {
  getMemberPointsValue,
  getPointsServerSnapshot,
  getPointsSnapshot,
  subscribePointsStore,
} from "@/lib/points/points-store";

const DISCIPLINE_RULES = [
  {
    id: "oral-to-reprimand",
    label: "3 устных замечания",
    result: "1 выговор",
    hint: "Каждое третье устное замечание автоматически считается выговором.",
  },
  {
    id: "reprimand-to-dismissal",
    label: "3 выговора",
    result: "снятие с должности",
    hint: "Набрав три выговора, модератор снимается с должности и покидает состав.",
  },
];

export function PointsModsTab({ canEdit }: { canEdit: boolean }) {
  const members = useSyncExternalStore(
    subscribeTeamStore,
    getTeamMembersSnapshot,
    getTeamServerSnapshot
  );
  const points = useSyncExternalStore(
    subscribePointsStore,
    getPointsSnapshot,
    getPointsServerSnapshot
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memberEditor, setMemberEditor] = useState<TeamMember | null>(null);

  const editingMember = members.find((member) => member.id === editingId);

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">
            Баллы модераторов
          </h2>
          <p className="text-xs text-muted-foreground">
            Баллы каждого модератора и свод правил дисциплины.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            Свод правил дисциплины
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {DISCIPLINE_RULES.map((rule) => (
            <Card key={rule.id} className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  {rule.label}
                </CardTitle>
                <CardDescription>{rule.hint}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="bg-primary/15 text-primary ring-1 ring-primary/30">
                  {rule.label} = {rule.result}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Coins className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            Баллы модераторов
          </h3>
          <Badge variant="secondary">{members.length}</Badge>
        </div>

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
                Добавьте модераторов в разделе «Команда», чтобы вести учёт их
                баллов.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th
                    className="border-b border-border/60 bg-card px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    scope="col"
                  >
                    Модератор
                  </th>
                  <th
                    className="border-b border-border/60 bg-card px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    scope="col"
                  >
                    Баллы
                  </th>
                  {canEdit ? (
                    <th
                      className="w-24 border-b border-border/60 bg-card px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      scope="col"
                    >
                      Действия
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const memberPoints = getMemberPointsValue(points, member.id);
                  return (
                    <tr key={member.id}>
                      <td className="border-b border-border/60 px-4 py-2.5">
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
                      </td>
                      <td className="border-b border-border/60 px-4 py-2.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Coins className="size-4 text-primary" />
                          {memberPoints}
                        </span>
                      </td>
                      {canEdit ? (
                        <td className="border-b border-border/60 px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Изменить данные модератора ${member.nickname}`}
                              onClick={() => setMemberEditor(member)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Изменить баллы модератора ${member.nickname}`}
                              onClick={() => setEditingId(member.id)}
                            >
                              <Coins />
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingMember ? (
        <MemberPointsDialog
          memberId={editingMember.id}
          nickname={editingMember.nickname}
          initialPoints={getMemberPointsValue(points, editingMember.id)}
          onClose={() => setEditingId(null)}
        />
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
