import type { Result } from "@/lib/auth/auth-store";
import { listTeamMembers } from "@/lib/team/team-store";

export type AttestationKey =
  | "rules"
  | "communication"
  | "cheatChecks"
  | "deepCheatChecks";

export type AttestationEntry = Record<AttestationKey, boolean>;

export type AttestationData = {
  version: 1;
  entries: Record<string, AttestationEntry>;
};

const STORAGE_KEY = "mod-panel-attestations-v1";

const EMPTY_DATA: AttestationData = { version: 1, entries: {} };

const listeners = new Set<() => void>();

let cachedData: AttestationData | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function seedEntries(): Record<string, AttestationEntry> {
  const entries: Record<string, AttestationEntry> = {};
  listTeamMembers().forEach((member, memberIndex) => {
    entries[member.id] = {
      rules: memberIndex % 2 === 0,
      communication: memberIndex % 3 !== 0,
      cheatChecks: memberIndex === 0 || memberIndex === 3,
      deepCheatChecks: memberIndex === 0,
    };
  });
  return entries;
}

export function loadAttestationData(): AttestationData {
  if (!isBrowser()) return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded: AttestationData = { version: 1, entries: seedEntries() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as AttestationData;
    if (
      !parsed ||
      parsed.version !== 1 ||
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

function saveAttestationData(data: AttestationData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function subscribeAttestationStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function refreshSnapshot(): void {
  cachedData = loadAttestationData();
  for (const listener of listeners) {
    listener();
  }
}

export function getAttestationSnapshot(): AttestationData {
  if (cachedData === null) {
    cachedData = loadAttestationData();
  }
  return cachedData;
}

export function getAttestationServerSnapshot(): AttestationData {
  return EMPTY_DATA;
}

export function toggleAttestation(
  memberId: string,
  key: AttestationKey
): Result {
  const data = loadAttestationData();
  const entry = data.entries[memberId] ?? {
    rules: false,
    communication: false,
    cheatChecks: false,
    deepCheatChecks: false,
  };
  entry[key] = !entry[key];
  data.entries[memberId] = entry;
  saveAttestationData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}
