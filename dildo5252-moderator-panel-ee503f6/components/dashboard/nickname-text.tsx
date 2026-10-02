import { cn } from "@/lib/utils";
import { getNicknameGradient } from "@/lib/data";

export function NicknameText({
  nickname,
  gradient,
  className,
}: {
  nickname: string;
  gradient?: string | null;
  className?: string;
}) {
  const preset = getNicknameGradient(gradient);
  if (!preset) {
    return <span className={className}>{nickname}</span>;
  }
  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{ backgroundImage: preset.gradient }}
    >
      {nickname}
    </span>
  );
}
