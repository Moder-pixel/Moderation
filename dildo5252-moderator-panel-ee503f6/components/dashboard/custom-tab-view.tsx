"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FilePenLine,
  LayoutGrid,
  ListPlus,
  Pencil,
  Plus,
  Trash2,
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
import { CustomTabDialog } from "@/components/dashboard/custom-tab-dialog";
import { CustomTabEntryDialog } from "@/components/dashboard/custom-tab-entry-dialog";
import {
  removeCustomTab,
  removeCustomTabEntry,
  type CustomTab,
  type CustomTabEntry,
} from "@/lib/tabs/custom-tabs-store";

type EntryEditor =
  { type: "add" } | { type: "edit"; entry: CustomTabEntry } | null;

export function CustomTabView({
  tab,
  canEdit,
}: {
  tab: CustomTab;
  canEdit: boolean;
}) {
  const [entryEditor, setEntryEditor] = useState<EntryEditor>(null);
  const [tabEditorOpen, setTabEditorOpen] = useState(false);
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<
    string | null
  >(null);
  const [confirmDeleteTab, setConfirmDeleteTab] = useState(false);

  function handleRemoveEntry(entryId: string) {
    if (confirmDeleteEntryId !== entryId) {
      setConfirmDeleteEntryId(entryId);
      return;
    }
    const result = removeCustomTabEntry(tab.id, entryId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Запись удалена");
    setConfirmDeleteEntryId(null);
  }

  function handleRemoveTab() {
    const result = removeCustomTab(tab.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Вкладка удалена");
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              {tab.name}
            </h2>
            <Badge variant="secondary">Своя вкладка</Badge>
          </div>
          {tab.description ? (
            <p className="text-xs text-muted-foreground">{tab.description}</p>
          ) : null}
        </div>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setTabEditorOpen(true)}>
              <FilePenLine data-icon="inline-start" />
              Изменить вкладку
            </Button>
            {confirmDeleteTab ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveTab}
                >
                  <Trash2 data-icon="inline-start" />
                  Удалить
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDeleteTab(false)}
                >
                  Отмена
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDeleteTab(true)}
              >
                <Trash2 data-icon="inline-start" />
                Удалить вкладку
              </Button>
            )}
          </div>
        ) : null}
      </header>

      {tab.entries.length === 0 ? (
        <Empty className="h-full rounded-xl border border-dashed border-border/50 bg-card/40 py-14">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-14 rounded-full bg-primary/10 text-primary"
            >
              <LayoutGrid className="size-7" />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold tracking-tight">
              Записей пока нет
            </EmptyTitle>
            <EmptyDescription className="max-w-md">
              {canEdit
                ? "Добавьте первую запись на вкладку — строку с заголовком и текстом."
                : "Записи появятся здесь после добавления их администрацией."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {canEdit ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEntryEditor({ type: "add" })}
              >
                <Plus data-icon="inline-start" />
                Добавить запись
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {tab.entries.map((entry) => (
            <Card key={entry.id} className="card-hover">
              <CardHeader>
                {entry.title ? (
                  <CardTitle className="truncate">{entry.title}</CardTitle>
                ) : null}
                {canEdit ? (
                  <CardAction>
                    <div className="flex items-center gap-1.5">
                      {confirmDeleteEntryId === entry.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveEntry(entry.id)}
                          >
                            <Trash2 data-icon="inline-start" />
                            Удалить
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteEntryId(null)}
                          >
                            Отмена
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Изменить запись ${
                              entry.title || entry.id
                            }`}
                            onClick={() =>
                              setEntryEditor({ type: "edit", entry })
                            }
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Удалить запись ${
                              entry.title || entry.id
                            }`}
                            onClick={() => handleRemoveEntry(entry.id)}
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardAction>
                ) : null}
              </CardHeader>
              {entry.text ? (
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed">
                    {entry.text}
                  </p>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {canEdit ? (
        <div className="mt-auto pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEntryEditor({ type: "add" })}
          >
            <ListPlus data-icon="inline-start" />
            Добавить запись
          </Button>
        </div>
      ) : null}

      {entryEditor ? (
        <CustomTabEntryDialog
          tabId={tab.id}
          initial={entryEditor.type === "edit" ? entryEditor.entry : null}
          onClose={() => setEntryEditor(null)}
        />
      ) : null}
      {tabEditorOpen ? (
        <CustomTabDialog
          initial={tab}
          onClose={() => setTabEditorOpen(false)}
        />
      ) : null}
    </div>
  );
}
