"use client";

import { useEffect, useSyncExternalStore } from "react";

import { loadSession, subscribeAuthStore } from "@/lib/auth/auth-store";
import {
  applyTheme,
  DEFAULT_THEME,
  getStoredTheme,
  subscribeThemeStore,
  type ThemeId,
} from "@/lib/theme/theme-store";

function subscribeThemeAndAuth(callback: () => void): () => void {
  const unsubscribeTheme = subscribeThemeStore(callback);
  const unsubscribeAuth = subscribeAuthStore(callback);
  return () => {
    unsubscribeTheme();
    unsubscribeAuth();
  };
}

function getEffectiveTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const session = loadSession();
  return getStoredTheme(session?.id ?? null);
}

export function ThemeProvider({ children }: { children?: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeThemeAndAuth,
    getEffectiveTheme,
    () => DEFAULT_THEME
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return <>{children}</>;
}

export function useTheme(userId: string | null): ThemeId {
  return useSyncExternalStore(
    subscribeThemeStore,
    () => getStoredTheme(userId),
    () => DEFAULT_THEME
  );
}
