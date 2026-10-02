import type { Result } from "@/lib/auth/auth-store";

export type TeamMember = {
  id: string;
  nickname: string;
  position: string;
  joinedAt: string;
  punishments: number;
  onVacation: boolean;
  vkUrl: string;
  nicknameGradient: string | null;
};

export type TeamData = {
  version: 2;
  members: TeamMember[];
};

const STORAGE_KEY = "mod-panel-team-v1";

const EMPTY_MEMBERS: TeamMember[] = [];

const listeners = new Set<() => void>();

let cachedMembers: TeamMember[] | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function generateId(): string {
  return crypto.randomUUID();
}

function seedMembers(): TeamMember[] {
  return [
    {
      id: "seed-owner",
      nickname: "AlexeyCore",
      position: "Владелец",
      joinedAt: "2023-05-12",
      punishments: 210,
      onVacation: false,
      vkUrl: "https://vk.com/alexeycore",
      nicknameGradient: null,
    },
    {
      id: "seed-1",
      nickname: "NightShadow",
      position: "Главный Модер",
      joinedAt: "2024-01-15",
      punishments: 148,
      onVacation: false,
      vkUrl: "https://vk.com/nightshadow",
      nicknameGradient: null,
    },
    {
      id: "seed-2",
      nickname: "DariaHelper",
      position: "Хелпер",
      joinedAt: "2024-06-02",
      punishments: 41,
      onVacation: true,
      vkUrl: "https://vk.com/dariahelper",
      nicknameGradient: null,
    },
    {
      id: "seed-3",
      nickname: "GreenPanda",
      position: "Модератор",
      joinedAt: "2024-09-21",
      punishments: 87,
      onVacation: false,
      vkUrl: "https://vk.com/greenpanda",
      nicknameGradient: null,
    },
    {
      id: "seed-4",
      nickname: "VikaTech",
      position: "Тех.Админ",
      joinedAt: "2023-11-03",
      punishments: 64,
      onVacation: true,
      vkUrl: "https://vk.com/vikatech",
      nicknameGradient: null,
    },
  ];
}

export function loadTeamData(): TeamData {
  if (!isBrowser()) return { version: 2, members: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded: TeamData = { version: 2, members: seedMembers() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as {
      version: 1 | 2;
      members?: Array<
        Partial<TeamMember> & {
          id: string;
          nickname: string;
          position: string;
        }
      >;
    };
    if (
      !parsed ||
      (parsed.version !== 1 && parsed.version !== 2) ||
      !Array.isArray(parsed.members)
    ) {
      return { version: 2, members: [] };
    }
    if (parsed.version === 1) {
      const migrated: TeamData = {
        version: 2,
        members: parsed.members.map((member) => ({
          id: member.id,
          nickname: member.nickname,
          position: member.position,
          joinedAt: member.joinedAt ?? "",
          punishments: member.punishments ?? 0,
          onVacation: member.onVacation ?? false,
          vkUrl: member.vkUrl ?? "",
          nicknameGradient: member.nicknameGradient ?? null,
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return { version: 2, members: parsed.members as TeamMember[] };
  } catch {
    return { version: 2, members: [] };
  }
}

function saveTeamData(data: TeamData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function subscribeTeamStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function refreshSnapshot(): void {
  cachedMembers = loadTeamData().members;
  for (const listener of listeners) {
    listener();
  }
}

export function getTeamMembersSnapshot(): TeamMember[] {
  if (cachedMembers === null) {
    cachedMembers = loadTeamData().members;
  }
  return cachedMembers;
}

export function getTeamServerSnapshot(): TeamMember[] {
  return EMPTY_MEMBERS;
}

export function listTeamMembers(): TeamMember[] {
  return loadTeamData().members;
}

export function addTeamMember(
  input: Omit<TeamMember, "id">
): Result<TeamMember> {
  const data = loadTeamData();
  if (input.nickname.trim().length < 2) {
    return { ok: false, error: "Ник слишком короткий" };
  }
  const member: TeamMember = {
    id: generateId(),
    nickname: input.nickname.trim(),
    position: input.position,
    joinedAt: input.joinedAt,
    punishments: Math.max(0, Math.floor(input.punishments)),
    onVacation: input.onVacation,
    vkUrl: input.vkUrl.trim(),
    nicknameGradient: input.nicknameGradient ?? null,
  };
  data.members.push(member);
  saveTeamData(data);
  refreshSnapshot();
  return { ok: true, data: member };
}

export function updateTeamMember(
  id: string,
  input: Omit<TeamMember, "id">
): Result<TeamMember> {
  const data = loadTeamData();
  const index = data.members.findIndex((member) => member.id === id);
  if (index === -1) {
    return { ok: false, error: "Модератор не найден" };
  }
  if (input.nickname.trim().length < 2) {
    return { ok: false, error: "Ник слишком короткий" };
  }
  const updated: TeamMember = {
    ...data.members[index],
    nickname: input.nickname.trim(),
    position: input.position,
    joinedAt: input.joinedAt,
    punishments: Math.max(0, Math.floor(input.punishments)),
    onVacation: input.onVacation,
    vkUrl: input.vkUrl.trim(),
    nicknameGradient: input.nicknameGradient ?? null,
  };
  data.members[index] = updated;
  saveTeamData(data);
  refreshSnapshot();
  return { ok: true, data: updated };
}

export function updateTeamMemberGradient(
  id: string,
  gradient: string | null
): Result {
  const data = loadTeamData();
  const member = data.members.find((item) => item.id === id);
  if (!member) {
    return { ok: false, error: "Модератор не найден" };
  }
  member.nicknameGradient = gradient;
  saveTeamData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}

export function removeTeamMember(id: string): Result {
  const data = loadTeamData();
  if (!data.members.some((member) => member.id === id)) {
    return { ok: false, error: "Модератор не найден" };
  }
  data.members = data.members.filter((member) => member.id !== id);
  saveTeamData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}
