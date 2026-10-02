"use client";

import { useState, useSyncExternalStore } from "react";
import {
  BookOpenText,
  Construction,
  MessagesSquare,
  PencilLine,
  Scale,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PromotionCriteriaDialog } from "@/components/dashboard/promotion-criteria-dialog";
import {
  getRulesServerSnapshot,
  getRulesSnapshot,
  MANUAL_SECTIONS,
  RULES_SECTIONS,
  subscribeRulesStore,
} from "@/lib/rules/rules-store";

export function RulesTab({ canEdit }: { canEdit: boolean }) {
  const rules = useSyncExternalStore(
    subscribeRulesStore,
    getRulesSnapshot,
    getRulesServerSnapshot
  );
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const criteriaText = rules.promotionCriteria.join("\n");

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">
            Правила сервера и мануал
          </h2>
          <p className="text-xs text-muted-foreground">
            Полный текст правил П1–П5, мануал по общению и критерии повышения.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            Правила сервера
          </h3>
          <Badge variant="secondary">П1–П5</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {RULES_SECTIONS.map((section) => (
            <Card key={section.id} className="card-hover">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.lead}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <MessagesSquare className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            Мануал по общению с игроками и коллегами
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {MANUAL_SECTIONS.map((section) => (
            <Card key={section.id} className="card-hover">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.lead}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpenText className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight">
              Критерии повышения
            </h3>
            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-500"
            >
              <Construction />В разработке
            </Badge>
          </div>
          {canEdit ? (
            <Button size="sm" onClick={() => setCriteriaOpen(true)}>
              <PencilLine data-icon="inline-start" />
              Дополнить раздел
            </Button>
          ) : null}
        </div>
        <Card
          className={
            canEdit
              ? "border-dashed border-primary/30 ring-1 ring-primary/20"
              : ""
          }
        >
          <CardContent className="flex flex-col gap-3 py-5">
            {criteriaText.length > 0 ? (
              <div className="flex flex-col gap-2 text-sm leading-relaxed">
                {rules.promotionCriteria.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Раздел пока не заполнен. Содержимое добавит администрация —
                следите за обновлениями.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {criteriaOpen ? (
        <PromotionCriteriaDialog
          initialText={criteriaText}
          onClose={() => setCriteriaOpen(false)}
        />
      ) : null}
    </div>
  );
}
