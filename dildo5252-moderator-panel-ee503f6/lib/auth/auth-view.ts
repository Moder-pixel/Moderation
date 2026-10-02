import {
  getUserById,
  isBootstrapped,
  loadSession,
  subscribeAuthStore,
  type SessionUser,
} from "./auth-store";

export type AuthPhase = "loading" | "setup" | "login" | "dashboard";

export type AuthView = {
  phase: AuthPhase;
  user: SessionUser | null;
};

const SERVER_VIEW: AuthView = { phase: "loading", user: null };

let cachedView: AuthView | null = null;

function computeAuthView(): AuthView {
  if (typeof window === "undefined") {
    return { phase: "loading", user: null };
  }
  if (!isBootstrapped()) {
    return { phase: "setup", user: null };
  }
  const session = loadSession();
  if (session) {
    const fresh = getUserById(session.id);
    if (fresh) {
      return { phase: "dashboard", user: fresh };
    }
  }
  return { phase: "login", user: null };
}

export function getAuthView(): AuthView {
  if (cachedView) return cachedView;
  cachedView = computeAuthView();
  return cachedView;
}

export function getServerAuthView(): AuthView {
  return SERVER_VIEW;
}

export function subscribeAuthView(listener: () => void): () => void {
  return subscribeAuthStore(() => {
    cachedView = null;
    listener();
  });
}
