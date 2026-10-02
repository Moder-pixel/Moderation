import { cn } from "@/lib/utils";
import { NICKNAME_GRADIENTS } from "@/lib/data";

export function GradientPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Подсветка ника градиентом
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
            value === ""
              ? "border-primary/60 bg-primary/10 text-foreground"
              : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
          )}
        >
          Без подсветки
        </button>
        {NICKNAME_GRADIENTS.map((preset) => {
          const active = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                active
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
              )}
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundImage: preset.gradient }}
              />
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
