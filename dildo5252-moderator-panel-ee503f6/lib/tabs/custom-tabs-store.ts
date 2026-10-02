import type { Result } from "@/lib/auth/auth-store";

export type CustomTabEntry = {
  id: string;
  title: string;
  text: string;
};

export type CustomTab = {
  id: string;
  name: string;
  description: string;
  entries: CustomTabEntry[];
};

export type CustomTabsData = {
  version: 1;
  tabs: CustomTab[];
};

export type CustomTabInput = {
  name: string;
  description: string;
  entries: Array<{ title: string; text: string }>;
};

export type CustomTabEntryInput = {
  title: string;
  text: string;
};

const STORAGE_KEY = "mod-panel-custom-tabs-v1";

const EMPTY_TABS: CustomTab[] = [];

const listeners = new Set<() => void>();

let cachedTabs: CustomTab[] | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function generateId(): string {
  return `custom-${crypto.randomUUID()}`;
}

export function loadCustomTabsData(): CustomTabsData {
  if (!isBrowser()) return { version: 1, tabs: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { version: 1, tabs: [] };
    }
    const parsed = JSON.parse(raw) as CustomTabsData;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.tabs)) {
      return { version: 1, tabs: [] };
    }
    return parsed;
  } catch {
    return { version: 1, tabs: [] };
  }
}

function saveCustomTabsData(data: CustomTabsData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function subscribeCustomTabsStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function refreshSnapshot(): void {
  cachedTabs = loadCustomTabsData().tabs;
  for (const listener of listeners) {
    listener();
  }
}

export function getCustomTabsSnapshot(): CustomTab[] {
  if (cachedTabs === null) {
    cachedTabs = loadCustomTabsData().tabs;
  }
  return cachedTabs;
}

export function getCustomTabsServerSnapshot(): CustomTab[] {
  return EMPTY_TABS;
}

export function getCustomTabById(id: string): CustomTab | null {
  return loadCustomTabsData().tabs.find((tab) => tab.id === id) ?? null;
}

function normalizeTabInput(input: CustomTabInput): {
  name: string;
  description: string;
  entries: Array<{ title: string; text: string }>;
} {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    entries: input.entries
      .filter(
        (entry) => entry.title.trim().length > 0 || entry.text.trim().length > 0
      )
      .map((entry) => ({
        title: entry.title.trim(),
        text: entry.text.trim(),
      })),
  };
}

function validateTabInput(input: CustomTabInput): string | null {
  if (input.name.trim().length < 2) {
    return "Название вкладки слишком короткое";
  }
  return null;
}

function buildTab(input: CustomTabInput, id: string): CustomTab {
  const normalized = normalizeTabInput(input);
  return {
    id,
    name: normalized.name,
    description: normalized.description,
    entries: normalized.entries.map((entry) => ({
      id: generateId(),
      title: entry.title,
      text: entry.text,
    })),
  };
}

export function addCustomTab(input: CustomTabInput): Result<CustomTab> {
  const error = validateTabInput(input);
  if (error !== null) {
    return { ok: false, error };
  }
  const data = loadCustomTabsData();
  const tab = buildTab(input, generateId());
  data.tabs.push(tab);
  saveCustomTabsData(data);
  refreshSnapshot();
  return { ok: true, data: tab };
}

export function updateCustomTab(
  id: string,
  input: CustomTabInput
): Result<CustomTab> {
  const data = loadCustomTabsData();
  const index = data.tabs.findIndex((tab) => tab.id === id);
  if (index === -1) {
    return { ok: false, error: "Вкладка не найдена" };
  }
  const error = validateTabInput(input);
  if (error !== null) {
    return { ok: false, error };
  }
  const updated = buildTab(input, id);
  data.tabs[index] = updated;
  saveCustomTabsData(data);
  refreshSnapshot();
  return { ok: true, data: updated };
}

export function removeCustomTab(id: string): Result {
  const data = loadCustomTabsData();
  if (!data.tabs.some((tab) => tab.id === id)) {
    return { ok: false, error: "Вкладка не найдена" };
  }
  data.tabs = data.tabs.filter((tab) => tab.id !== id);
  saveCustomTabsData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}

export function addCustomTabEntry(
  tabId: string,
  input: CustomTabEntryInput
): Result<CustomTabEntry> {
  const data = loadCustomTabsData();
  const tab = data.tabs.find((item) => item.id === tabId);
  if (!tab) {
    return { ok: false, error: "Вкладка не найдена" };
  }
  if (input.title.trim().length < 1 && input.text.trim().length < 1) {
    return { ok: false, error: "Запись не может быть пустой" };
  }
  const entry: CustomTabEntry = {
    id: generateId(),
    title: input.title.trim(),
    text: input.text.trim(),
  };
  tab.entries.push(entry);
  saveCustomTabsData(data);
  refreshSnapshot();
  return { ok: true, data: entry };
}

export function updateCustomTabEntry(
  tabId: string,
  entryId: string,
  input: CustomTabEntryInput
): Result<CustomTabEntry> {
  const data = loadCustomTabsData();
  const tab = data.tabs.find((item) => item.id === tabId);
  if (!tab) {
    return { ok: false, error: "Вкладка не найдена" };
  }
  const entry = tab.entries.find((item) => item.id === entryId);
  if (!entry) {
    return { ok: false, error: "Запись не найдена" };
  }
  if (input.title.trim().length < 1 && input.text.trim().length < 1) {
    return { ok: false, error: "Запись не может быть пустой" };
  }
  entry.title = input.title.trim();
  entry.text = input.text.trim();
  saveCustomTabsData(data);
  refreshSnapshot();
  return { ok: true, data: entry };
}

export function removeCustomTabEntry(tabId: string, entryId: string): Result {
  const data = loadCustomTabsData();
  const tab = data.tabs.find((item) => item.id === tabId);
  if (!tab) {
    return { ok: false, error: "Вкладка не найдена" };
  }
  if (!tab.entries.some((entry) => entry.id === entryId)) {
    return { ok: false, error: "Запись не найдена" };
  }
  tab.entries = tab.entries.filter((entry) => entry.id !== entryId);
  saveCustomTabsData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}
