"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  BookOpenText,
  CalendarCheck2,
  ClipboardCheck,
  Coins,
  FilePlus2,
  Gamepad2,
  LayoutGrid,
  ListPlus,
  LockKeyhole,
  LogOut,
  Network,
  PencilLine,
  Plus,
  Settings,
  ShieldCheck,
  ShoppingBag,
  UserCircle,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGateDialog } from "@/components/auth/admin-gate-dialog";
import { AdminSettingsDialog } from "@/components/dashboard/admin-settings-dialog";
import { AttestationsTab } from "@/components/dashboard/attestations-tab";
import { CustomTabDialog } from "@/components/dashboard/custom-tab-dialog";
import { CustomTabView } from "@/components/dashboard/custom-tab-view";
import { GroupsTab } from "@/components/dashboard/groups-tab";
import { PointsModsTab } from "@/components/dashboard/points-mods-tab";
import { PointsStoreTab } from "@/components/dashboard/points-store-tab";
import { RulesTab } from "@/components/dashboard/rules-tab";
import { TeamCardsTab } from "@/components/dashboard/team-cards-tab";
import { TeamContactsTab } from "@/components/dashboard/team-contacts-tab";
import { WorkTab } from "@/components/dashboard/work-tab";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import type { SessionUser } from "@/lib/auth/auth-store";
import {
  getCustomTabsServerSnapshot,
  getCustomTabsSnapshot,
  subscribeCustomTabsStore,
} from "@/lib/tabs/custom-tabs-store";

type TabItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const tabs: TabItem[] = [
  {
    id: "team",
    label: "Команда",
    title: "Команда",
    description:
      "Карточки модераторов: ник, должность, дата вступления, выданные наказания и статус отпуска.",
    icon: Users,
  },
  {
    id: "contacts",
    label: "Контакты",
    title: "Контакты",
    description: "Список модераторов с ником, должностью и ссылкой на ВК.",
    icon: AtSign,
  },
  {
    id: "work",
    label: "Выработка и нормы",
    title: "Выработка и нормы",
    description:
      "Таблица выработки по дням месяца с отметками о выполнении нормы.",
    icon: CalendarCheck2,
  },
  {
    id: "rules",
    label: "Правила и мануал",
    title: "Правила и мануал",
    description:
      "Правила сервера П1–П5, мануал по общению и критерии повышения.",
    icon: BookOpenText,
  },
  {
    id: "attestations",
    label: "Аттестации",
    title: "Аттестации",
    description:
      "Таблица аттестаций: по правилам, общению и проверкам на читы.",
    icon: ClipboardCheck,
  },
  {
    id: "points-store",
    label: "Баллы и магазин",
    title: "Баллы и магазин",
    description:
      "Зарплаты должностей в баллах и магазин, где баллы можно потратить.",
    icon: ShoppingBag,
  },
  {
    id: "points-mods",
    label: "Баллы модераторов",
    title: "Баллы модераторов",
    description: "Баллы каждого модератора и свод правил дисциплины.",
    icon: Coins,
  },
  {
    id: "groups",
    label: "Группы",
    title: "Группы",
    description: "Три группы модераторов: лидеры и состав каждой группы.",
    icon: Network,
  },
];

function TabStub({ tab, canEdit }: { tab: TabItem; canEdit: boolean }) {
  const Icon = tab.icon;
  return (
    <Empty className="h-full rounded-xl border border-dashed border-border/50 bg-card/40 py-16">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-14 rounded-full bg-primary/10 text-primary"
        >
          <Icon className="size-7" />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold tracking-tight">
          {tab.title}
        </EmptyTitle>
        <EmptyDescription className="max-w-md">
          {tab.description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {canEdit ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.info(
                  "Наполнение раздела появится в следующих обновлениях"
                )
              }
            >
              <PencilLine data-icon="inline-start" />
              Редактировать раздел
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.info(
                  "Добавление элементов появится в следующих обновлениях"
                )
              }
            >
              <ListPlus data-icon="inline-start" />
              Добавить элемент
            </Button>
          </div>
        ) : (
          <Badge variant="secondary">Раздел в разработке</Badge>
        )}
      </EmptyContent>
    </Empty>
  );
}

export function DashboardPanel({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  const [adminMode, setAdminMode] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateAttempt, setGateAttempt] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customTabDialogOpen, setCustomTabDialogOpen] = useState(false);

  const customTabs = useSyncExternalStore(
    subscribeCustomTabsStore,
    getCustomTabsSnapshot,
    getCustomTabsServerSnapshot
  );

  const isOwner = user.role === "owner";

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-6 px-4 py-8 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="gradient-neon flex size-10 items-center justify-center rounded-xl text-background">
            <Gamepad2 className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold tracking-tight">
              Панель модератора
            </h1>
            <p className="text-xs text-muted-foreground">
              Модератор-панель Minecraft-проекта
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">
            <UserCircle />
            {user.nickname}
          </Badge>
          {isOwner && adminMode ? (
            <>
              <Badge
                variant="outline"
                className="border-primary/50 text-primary"
              >
                <ShieldCheck />
                Режим редактирования
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings data-icon="inline-start" />
                Админ-настройки
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdminMode(false);
                  toast("Режим редактирования выключен");
                }}
              >
                <LockKeyhole data-icon="inline-start" />
                Завершить
              </Button>
            </>
          ) : null}
          {isOwner && !adminMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGateAttempt((attempt) => attempt + 1);
                setGateOpen(true);
              }}
            >
              <ShieldCheck data-icon="inline-start" />
              Режим редактирования
            </Button>
          ) : null}
          <ThemeSwitcher userId={user.id} />
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut data-icon="inline-start" />
            Выйти
          </Button>
        </div>
      </header>

      {isOwner && adminMode ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <FilePlus2 className="size-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            Включён режим редактирования: доступны изменения данных, добавление
            элементов и админ-настройки.
          </p>
        </div>
      ) : null}

      <Tabs
        defaultValue="team"
        orientation="vertical"
        className="flex-1 items-stretch"
      >
        <div className="flex w-56 shrink-0 flex-col gap-2">
          <TabsList className="max-h-full self-stretch gap-1 overflow-y-auto rounded-xl p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <Icon data-icon="inline-start" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
            {customTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <LayoutGrid data-icon="inline-start" />
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {isOwner && adminMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomTabDialogOpen(true)}
            >
              <Plus data-icon="inline-start" />
              Новая вкладка
            </Button>
          ) : null}
        </div>

        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className={`flex-1 overflow-hidden rounded-xl border transition-colors ${
              adminMode
                ? "border-primary/40 ring-1 ring-primary/20"
                : "border-border/60"
            }`}
          >
            {tab.id === "team" ? (
              <TeamCardsTab canEdit={adminMode} />
            ) : tab.id === "contacts" ? (
              <TeamContactsTab canEdit={adminMode} />
            ) : tab.id === "work" ? (
              <WorkTab canEdit={adminMode} />
            ) : tab.id === "rules" ? (
              <RulesTab canEdit={adminMode} />
            ) : tab.id === "attestations" ? (
              <AttestationsTab canEdit={adminMode} />
            ) : tab.id === "points-store" ? (
              <PointsStoreTab canEdit={adminMode} />
            ) : tab.id === "points-mods" ? (
              <PointsModsTab canEdit={adminMode} />
            ) : tab.id === "groups" ? (
              <GroupsTab canEdit={adminMode} />
            ) : (
              <TabStub tab={tab} canEdit={adminMode} />
            )}
          </TabsContent>
        ))}

        {customTabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className={`flex-1 overflow-hidden rounded-xl border transition-colors ${
              adminMode
                ? "border-primary/40 ring-1 ring-primary/20"
                : "border-border/60"
            }`}
          >
            <CustomTabView tab={tab} canEdit={adminMode} />
          </TabsContent>
        ))}
      </Tabs>

      <AdminGateDialog
        key={gateAttempt}
        open={gateOpen}
        onOpenChange={setGateOpen}
        onUnlocked={() => setAdminMode(true)}
      />
      {settingsOpen ? (
        <AdminSettingsDialog onClose={() => setSettingsOpen(false)} />
      ) : null}
      {customTabDialogOpen ? (
        <CustomTabDialog
          initial={null}
          onClose={() => setCustomTabDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}
