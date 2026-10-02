"use client";

import { Check, Palette } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import {
  setTheme,
  THEME_IDS,
  THEME_LABELS,
  THEME_SWATCHES,
} from "@/lib/theme/theme-store";

export function ThemeSwitcher({ userId }: { userId?: string | null }) {
  const theme = useTheme(userId ?? null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Palette data-icon="inline-start" />
            Тема
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Тема интерфейса</DropdownMenuLabel>
          {THEME_IDS.map((id) => (
            <DropdownMenuItem
              key={id}
              onClick={() => setTheme(userId ?? null, id)}
            >
              <span
                aria-hidden="true"
                className="size-3 rounded-full ring-1 ring-foreground/20"
                style={{ backgroundColor: THEME_SWATCHES[id] }}
              />
              {THEME_LABELS[id]}
              {theme === id ? <Check className="ml-auto" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
