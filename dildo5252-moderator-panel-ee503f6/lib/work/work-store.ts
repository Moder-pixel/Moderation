import type { Result } from "@/lib/auth/auth-store";
import { listTeamMembers } from "@/lib/team/team-store";

export type WorkStatus = "done" | "failed" | "vacation";

export type WorkDay = {
  date: string;
  label: string;
};

export type WorkData = {
  version: 1;
  days: WorkDay[];
  entries: Record<string, Record<string, WorkStatus>>;
};

const STORAGE_KEY = "mod-panel-work-v1";

const EMPTY_DATA: WorkData = { version: 1, days: [], entries: {} };

const listeners = new Set<() => void>();

let cachedData: WorkData | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function seedDays(): WorkDay[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      date: `${year}-${pad2(month)}-${pad2(day)}`,
      label: String(day),
    };
  });
}

function seedEntries(
  days: WorkDay[]
): Record<string, Record<string, WorkStatus>> {
  const entries: Record<string, Record<string, WorkStatus>> = {};
  listTeamMembers().forEach((member, memberIndex) => {
    const row: Record<string, WorkStatus> = {};
    days.forEach((day, dayIndex) => {
      const dayNumber = Number(day.label);
      if ((dayNumber + dayIndex + memberIndex) % 5 === 0) {
        row[day.date] = "vacation";
      } else if ((dayNumber + memberIndex * 2) % 3 === 0) {
        row[day.date] = "failed";
      } else if ((dayNumber + memberIndex) % 2 === 0) {
        row[day.date] = "done";
      }
    });
    entries[member.id] = row;
  });
  return entries;
}

function seedWorkData(): WorkData {
  const days = seedDays();
  return { version: 1, days, entries: seedEntries(days) };
}

export function loadWorkData(): WorkData {
  if (!isBrowser()) return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded = seedWorkData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as WorkData;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.days) ||
      !parsed.entries ||
      typeof parsed.entries !== "object"
    ) {
      return EMPTY_DATA;
    }
    return parsed;
  } catch {
    return EMPTY_DATA;
  }
}

function saveWorkData(data: WorkData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function subscribeWorkStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function refreshSnapshot(): void {
  cachedData = loadWorkData();
  for (const listener of listeners) {
    listener();
  }
}

export function getWorkSnapshot(): WorkData {
  if (cachedData === null) {
    cachedData = loadWorkData();
  }
  return cachedData;
}

export function getWorkServerSnapshot(): WorkData {
  return EMPTY_DATA;
}

export function setWorkStatus(
  memberId: string,
  date: string,
  status: WorkStatus
): Result {
  const data = loadWorkData();
  if (!data.days.some((day) => day.date === date)) {
    return { ok: false, error: "Дата не найдена в таблице" };
  }
  const row = data.entries[memberId] ?? {};
  row[date] = status;
  data.entries[memberId] = row;
  saveWorkData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}

export function clearWorkStatus(memberId: string, date: string): Result {
  const data = loadWorkData();
  const row = data.entries[memberId];
  if (row && date in row) {
    delete row[date];
    saveWorkData(data);
    refreshSnapshot();
  }
  return { ok: true, data: undefined };
}

export function addWorkDay(date: string): Result<WorkDay> {
  const data = loadWorkData();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Укажите корректную дату" };
  }
  if (data.days.some((day) => day.date === date)) {
    return { ok: false, error: "Такая дата уже есть в таблице" };
  }
  const day: WorkDay = { date, label: String(Number(date.slice(8, 10))) };
  data.days.push(day);
  data.days.sort((a, b) => a.date.localeCompare(b.date));
  saveWorkData(data);
  refreshSnapshot();
  return { ok: true, data: day };
}

export function removeWorkDay(date: string): Result {
  const data = loadWorkData();
  if (!data.days.some((day) => day.date === date)) {
    return { ok: false, error: "Дата не найдена в таблице" };
  }
  data.days = data.days.filter((day) => day.date !== date);
  for (const memberId of Object.keys(data.entries)) {
    delete data.entries[memberId][date];
  }
  saveWorkData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}
