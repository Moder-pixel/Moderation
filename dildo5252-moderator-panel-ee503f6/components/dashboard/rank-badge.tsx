import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getRankStyle } from "@/lib/data";

export function RankBadge({
  position,
  className,
}: {
  position: string;
  className?: string;
}) {
  const style = getRankStyle(position);
  return (
    <Badge
      variant="outline"
      className={cn("w-fit border-transparent", className)}
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: style.borderColor,
      }}
    >
      {position}
    </Badge>
  );
}
