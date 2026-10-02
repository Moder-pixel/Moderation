"use client";

import { useSyncExternalStore } from "react";

import { LoginScreen } from "@/components/auth/login-screen";
import { SetupScreen } from "@/components/auth/setup-screen";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import {
  getAuthView,
  getServerAuthView,
  subscribeAuthView,
} from "@/lib/auth/auth-view";
import { clearSession, saveSession } from "@/lib/auth/auth-store";

export function AppShell() {
  const { phase, user } = useSyncExternalStore(
    subscribeAuthView,
    getAuthView,
    getServerAuthView
  );

  if (phase === "setup") {
    return <SetupScreen onComplete={saveSession} />;
  }

  if (phase === "login") {
    return <LoginScreen onLogin={saveSession} />;
  }

  if (phase === "dashboard" && user) {
    return <DashboardPanel user={user} onLogout={clearSession} />;
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center" />
  );
}
