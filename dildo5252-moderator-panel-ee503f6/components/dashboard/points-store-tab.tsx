"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  Coins,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
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
import { SalaryEditDialog } from "@/components/dashboard/salary-edit-dialog";
import { ShopItemDialog } from "@/components/dashboard/shop-item-dialog";
import { RankBadge } from "@/components/dashboard/rank-badge";
import { POSITIONS } from "@/lib/data";
import {
  getPointsServerSnapshot,
  getPointsSnapshot,
  getPositionSalary,
  removeShopItem,
  subscribePointsStore,
  type ShopItem,
} from "@/lib/points/points-store";

type EditorState =
  | { type: "salary"; position: string; points: number }
  | { type: "shop-add" }
  | { type: "shop-edit"; item: ShopItem }
  | null;

export function PointsStoreTab({ canEdit }: { canEdit: boolean }) {
  const points = useSyncExternalStore(
    subscribePointsStore,
    getPointsSnapshot,
    getPointsServerSnapshot
  );
  const [editor, setEditor] = useState<EditorState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleRemoveShopItem(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const result = removeShopItem(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Товар удалён из магазина");
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">
            Баллы и магазин
          </h2>
          <p className="text-xs text-muted-foreground">
            Зарплаты должностей в баллах и магазин, где баллы можно потратить.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight">
              Зарплаты по должностям
            </h3>
            <Badge variant="secondary">баллы за месяц</Badge>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th
                  className="border-b border-border/60 bg-card px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  scope="col"
                >
                  Должность
                </th>
                <th
                  className="border-b border-border/60 bg-card px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  scope="col"
                >
                  Зарплата в баллах
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
              {POSITIONS.map((position) => {
                const salary = getPositionSalary(points, position);
                return (
                  <tr key={position}>
                    <td className="border-b border-border/60 px-4 py-2.5">
                      <RankBadge position={position} />
                    </td>
                    <td className="border-b border-border/60 px-4 py-2.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Coins className="size-4 text-primary" />
                        {salary}
                      </span>
                    </td>
                    {canEdit ? (
                      <td className="border-b border-border/60 px-4 py-2 text-right">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Изменить зарплату должности ${position}`}
                          onClick={() =>
                            setEditor({
                              type: "salary",
                              position,
                              points: salary,
                            })
                          }
                        >
                          <Pencil />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight">
              Магазин за баллы
            </h3>
            <Badge variant="secondary">{points.shopItems.length}</Badge>
          </div>
          {canEdit ? (
            <Button size="sm" onClick={() => setEditor({ type: "shop-add" })}>
              <Plus data-icon="inline-start" />
              Добавить товар
            </Button>
          ) : null}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Покупка товаров —{" "}
            <span className="font-medium text-foreground">
              строго на твинк, раз в месяц
            </span>
            . Заказать покупку можно у администрации после накопления нужного
            количества баллов.
          </p>
        </div>

        {points.shopItems.length === 0 ? (
          <Empty className="h-full rounded-xl border border-dashed border-border/50 bg-card/40 py-12">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="size-14 rounded-full bg-primary/10 text-primary"
              >
                <ShoppingBag className="size-7" />
              </EmptyMedia>
              <EmptyTitle className="text-lg font-semibold tracking-tight">
                В магазине пока нет товаров
              </EmptyTitle>
              <EmptyDescription className="max-w-md">
                {canEdit
                  ? "Добавьте первый товар, который модераторы смогут купить за баллы."
                  : "Товары появятся здесь после добавления их администрацией."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {canEdit ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditor({ type: "shop-add" })}
                >
                  <Plus data-icon="inline-start" />
                  Добавить товар
                </Button>
              ) : null}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {points.shopItems.map((item) => (
              <Card key={item.id} className="card-hover">
                <CardHeader>
                  <CardTitle className="truncate">{item.name}</CardTitle>
                  {canEdit ? (
                    <CardAction>
                      <div className="flex items-center gap-1.5">
                        {confirmDeleteId === item.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveShopItem(item.id)}
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
                              aria-label={`Изменить товар ${item.name}`}
                              onClick={() =>
                                setEditor({ type: "shop-edit", item })
                              }
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Удалить товар ${item.name}`}
                              onClick={() => handleRemoveShopItem(item.id)}
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
                  {item.description ? (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                  <Badge className="w-fit bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Coins />
                    {item.cost} баллов
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {editor?.type === "salary" ? (
        <SalaryEditDialog
          position={editor.position}
          initialPoints={editor.points}
          onClose={() => setEditor(null)}
        />
      ) : null}
      {editor?.type === "shop-add" || editor?.type === "shop-edit" ? (
        <ShopItemDialog
          initial={editor.type === "shop-edit" ? editor.item : null}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </div>
  );
}
