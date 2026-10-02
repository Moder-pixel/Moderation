export type ThemeId = "green" | "neon" | "red" | "gray";

export const THEME_IDS: readonly ThemeId[] = ["green", "neon", "red", "gray"];

export const DEFAULT_THEME: ThemeId = "green";

export const THEME_LABELS: Record<ThemeId, string> = {
  green: "Зелёно-чёрная",
  neon: "Неоново-чёрная",
  red: "Красно-чёрная",
  gray: "Серо-чёрная",
};

export const THEME_SWATCHES: Record<ThemeId, string> = {
  green: "oklch(0.72 0.22 150)",
  neon: "oklch(0.83 0.13 198)",
  red: "oklch(0.66 0.23 25)",
  gray: "oklch(0.75 0 0)",
};

export type ThemeData = {
  version: 1;
  themes: Record<string, ThemeId>;
  last: ThemeId;
};

const STORAGE_KEY = "mod-panel-theme-v1";

const listeners = new Set<() => void>();

export function subscribeThemeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyThemeStore(): void {
  for (const listener of listeners) {
    listener();
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as readonly string[]).includes(value)
  );
}

export function loadThemeData(): ThemeData | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThemeData>;
    if (!parsed || parsed.version !== 1) return null;
    const themes: Record<string, ThemeId> = {};
    if (parsed.themes && typeof parsed.themes === "object") {
      for (const [userId, themeId] of Object.entries(parsed.themes)) {
        if (isThemeId(themeId)) themes[userId] = themeId;
      }
    }
    return {
      version: 1,
      themes,
      last: isThemeId(parsed.last) ? parsed.last : DEFAULT_THEME,
    };
  } catch {
    return null;
  }
}

export function getStoredTheme(userId: string | null): ThemeId {
  const data = loadThemeData();
  if (userId && data?.themes[userId]) return data.themes[userId];
  return data?.last ?? DEFAULT_THEME;
}

export function applyTheme(theme: ThemeId): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function setTheme(userId: string | null, theme: ThemeId): void {
  if (!isThemeId(theme)) return;
  if (!isBrowser()) return;
  const data = loadThemeData() ?? {
    version: 1,
    themes: {},
    last: DEFAULT_THEME,
  };
  if (userId) data.themes[userId] = theme;
  data.last = theme;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    return;
  }
  applyTheme(theme);
  notifyThemeStore();
}
