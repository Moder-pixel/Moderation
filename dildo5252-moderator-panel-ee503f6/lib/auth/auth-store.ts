export type UserRole = "owner" | "moderator";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
};

export type AuthData = {
  version: 1;
  adminSalt: string;
  adminPasswordHash: string;
  users: UserRecord[];
};

export type SessionUser = {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
};

export type UserListItem = {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
};

export type Result<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const STORAGE_KEY = "mod-panel-auth-v1";
const SESSION_KEY = "mod-panel-session-v1";

const listeners = new Set<() => void>();

export function subscribeAuthStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAuthStore(): void {
  for (const listener of listeners) {
    listener();
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

function generateId(): string {
  return crypto.randomUUID();
}

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const payload = `${salt}:${password}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload)
  );
  return toHex(new Uint8Array(digest));
}

function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
  };
}

export function loadAuthData(): AuthData | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthData;
    if (
      !parsed ||
      parsed.version !== 1 ||
      typeof parsed.adminPasswordHash !== "string" ||
      !Array.isArray(parsed.users)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthData(data: AuthData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notifyAuthStore();
}

export function isBootstrapped(): boolean {
  return loadAuthData() !== null;
}

export async function bootstrapAccount(input: {
  email: string;
  nickname: string;
  password: string;
  adminPassword: string;
}): Promise<Result<SessionUser>> {
  if (loadAuthData() !== null) {
    return { ok: false, error: "Аккаунты уже настроены" };
  }

  const email = input.email.trim().toLowerCase();
  const salt = generateSalt();
  const adminSalt = generateSalt();

  const owner: UserRecord = {
    id: generateId(),
    email,
    passwordHash: await hashPassword(input.password, salt),
    salt,
    nickname: input.nickname.trim(),
    role: "owner",
    createdAt: new Date().toISOString(),
  };

  const data: AuthData = {
    version: 1,
    adminSalt,
    adminPasswordHash: await hashPassword(input.adminPassword, adminSalt),
    users: [owner],
  };

  saveAuthData(data);
  return { ok: true, data: toSessionUser(owner) };
}

export async function authenticate(input: {
  email: string;
  password: string;
}): Promise<Result<SessionUser>> {
  const data = loadAuthData();
  if (!data) {
    return { ok: false, error: "Доступ ещё не настроен" };
  }

  const email = input.email.trim().toLowerCase();
  const user = data.users.find((item) => item.email === email);
  if (!user) {
    return { ok: false, error: "Неверный логин или пароль" };
  }

  const hash = await hashPassword(input.password, user.salt);
  if (hash !== user.passwordHash) {
    return { ok: false, error: "Неверный логин или пароль" };
  }

  return { ok: true, data: toSessionUser(user) };
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const data = loadAuthData();
  if (!data) return false;
  const hash = await hashPassword(password, data.adminSalt);
  return hash === data.adminPasswordHash;
}

export async function changeAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<Result> {
  const data = loadAuthData();
  if (!data) {
    return { ok: false, error: "Доступ ещё не настроен" };
  }
  if (!(await verifyAdminPassword(input.currentPassword))) {
    return { ok: false, error: "Текущий админ-пароль неверен" };
  }

  data.adminSalt = generateSalt();
  data.adminPasswordHash = await hashPassword(
    input.newPassword,
    data.adminSalt
  );
  saveAuthData(data);
  return { ok: true, data: undefined };
}

export function listUsers(): UserListItem[] {
  const data = loadAuthData();
  if (!data) return [];
  return data.users.map((user) => ({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
    createdAt: user.createdAt,
  }));
}

export function getUserById(id: string): SessionUser | null {
  const data = loadAuthData();
  if (!data) return null;
  const user = data.users.find((item) => item.id === id);
  return user ? toSessionUser(user) : null;
}

export async function addModerator(input: {
  email: string;
  nickname: string;
  password: string;
}): Promise<Result> {
  const data = loadAuthData();
  if (!data) {
    return { ok: false, error: "Доступ ещё не настроен" };
  }

  const email = input.email.trim().toLowerCase();
  if (data.users.some((user) => user.email === email)) {
    return { ok: false, error: "Аккаунт с такой почтой уже существует" };
  }
  if (input.password.length < 4) {
    return { ok: false, error: "Пароль слишком короткий" };
  }
  if (input.nickname.trim().length < 2) {
    return { ok: false, error: "Ник слишком короткий" };
  }

  const salt = generateSalt();
  data.users.push({
    id: generateId(),
    email,
    passwordHash: await hashPassword(input.password, salt),
    salt,
    nickname: input.nickname.trim(),
    role: "moderator",
    createdAt: new Date().toISOString(),
  });
  saveAuthData(data);
  return { ok: true, data: undefined };
}

export async function updateUser(
  id: string,
  input: { email: string; nickname: string; password?: string }
): Promise<Result> {
  const data = loadAuthData();
  if (!data) {
    return { ok: false, error: "Доступ ещё не настроен" };
  }

  const user = data.users.find((item) => item.id === id);
  if (!user) {
    return { ok: false, error: "Аккаунт не найден" };
  }
  if (user.role === "owner") {
    return { ok: false, error: "Аккаунт владельца менять здесь нельзя" };
  }

  const email = input.email.trim().toLowerCase();
  if (data.users.some((item) => item.id !== id && item.email === email)) {
    return { ok: false, error: "Аккаунт с такой почтой уже существует" };
  }
  if (input.nickname.trim().length < 2) {
    return { ok: false, error: "Ник слишком короткий" };
  }

  user.email = email;
  user.nickname = input.nickname.trim();

  if (input.password) {
    if (input.password.length < 4) {
      return { ok: false, error: "Новый пароль слишком короткий" };
    }
    user.salt = generateSalt();
    user.passwordHash = await hashPassword(input.password, user.salt);
  }

  saveAuthData(data);
  return { ok: true, data: undefined };
}

export function removeUser(id: string): Result {
  const data = loadAuthData();
  if (!data) {
    return { ok: false, error: "Доступ ещё не настроен" };
  }

  const user = data.users.find((item) => item.id === id);
  if (!user) {
    return { ok: false, error: "Аккаунт не найден" };
  }
  if (user.role === "owner") {
    return { ok: false, error: "Аккаунт владельца нельзя удалить" };
  }

  data.users = data.users.filter((item) => item.id !== id);
  saveAuthData(data);
  return { ok: true, data: undefined };
}

export function saveSession(user: SessionUser): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  notifyAuthStore();
}

export function loadSession(): SessionUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (parsed && typeof parsed.id === "string" && parsed.email) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SESSION_KEY);
  notifyAuthStore();
}

export function resetOwnerSettings(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  notifyAuthStore();
}
