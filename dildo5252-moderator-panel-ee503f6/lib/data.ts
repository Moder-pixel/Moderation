export const POSITIONS = [
  "Владелец",
  "Админ",
  "Куратор",
  "Тех.Админ",
  "Тех.Админ ДС",
  "Гл.Билдер",
  "Зам.Билдер",
  "Ст.Билдер",
  "Билдер",
  "Главный Модер",
  "Модератор",
  "Ст.Хелпер",
  "Хелпер",
  "Стажёр",
] as const;

export type RankStyle = {
  color: string;
  background: string;
  borderColor: string;
};

const DEFAULT_RANK_COLOR = "#94a3b8";

export const RANK_COLORS: Record<string, string> = {
  Владелец: "#000000",
  Админ: "#ef4444",
  Куратор: "#f97316",
  "Тех.Админ": "#eab308",
  "Тех.Админ ДС": "#84cc16",
  "Гл.Билдер": "#a855f7",
  "Зам.Билдер": "#c084fc",
  "Ст.Билдер": "#d8b4fe",
  Билдер: "#e9d5ff",
  "Главный Модер": "#38bdf8",
  Модератор: "#3b82f6",
  "Ст.Хелпер": "#a16207",
  Хелпер: "#fde047",
  Стажёр: "#3b82f6",
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => char + char)
          .join("")
      : clean;
  const value = parseInt(full, 16);
  if (Number.isNaN(value)) return `rgba(148, 163, 184, ${alpha})`;
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getRankStyle(position: string): RankStyle {
  const color = RANK_COLORS[position] ?? DEFAULT_RANK_COLOR;
  if (position === "Владелец") {
    return {
      color: "#fafafa",
      background: "#0a0a0a",
      borderColor: "#52525b",
    };
  }
  return {
    color,
    background: hexToRgba(color, 0.12),
    borderColor: hexToRgba(color, 0.45),
  };
}

export type NicknameGradient = {
  id: string;
  label: string;
  gradient: string;
};

export const NICKNAME_GRADIENTS: NicknameGradient[] = [
  {
    id: "neon",
    label: "Неоновый",
    gradient: "linear-gradient(120deg, #22d3ee 0%, #818cf8 50%, #f472b6 100%)",
  },
  {
    id: "fire",
    label: "Огненный",
    gradient: "linear-gradient(120deg, #f59e0b 0%, #ef4444 60%, #f97316 100%)",
  },
  {
    id: "ocean",
    label: "Океанский",
    gradient: "linear-gradient(120deg, #38bdf8 0%, #6366f1 50%, #34d399 100%)",
  },
  {
    id: "gold",
    label: "Золотой",
    gradient: "linear-gradient(120deg, #fde047 0%, #f59e0b 55%, #fbbf24 100%)",
  },
  {
    id: "rainbow",
    label: "Радужный",
    gradient:
      "linear-gradient(90deg, #f87171, #facc15, #4ade80, #60a5fa, #a78bfa)",
  },
];

export function getNicknameGradient(
  id: string | null | undefined
): NicknameGradient | null {
  if (!id) return null;
  return NICKNAME_GRADIENTS.find((gradient) => gradient.id === id) ?? null;
}
