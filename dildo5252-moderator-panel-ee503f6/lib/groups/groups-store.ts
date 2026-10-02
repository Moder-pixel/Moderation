import type { Result } from "@/lib/auth/auth-store";

export type GroupMember = {
  id: string;
  nickname: string;
  position: string;
  nicknameGradient: string | null;
};

export type ModeratorGroup = {
  id: string;
  name: string;
  leader: GroupMember;
  members: GroupMember[];
};

export type GroupsData = {
  version: 2;
  groups: ModeratorGroup[];
};

export type GroupInput = {
  name: string;
  leader: Omit<GroupMember, "id">;
  members: Omit<GroupMember, "id">[];
};

const STORAGE_KEY = "mod-panel-groups-v1";

const EMPTY_GROUPS: ModeratorGroup[] = [];

const listeners = new Set<() => void>();

let cachedGroups: ModeratorGroup[] | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function generateId(): string {
  return crypto.randomUUID();
}

function seedGroups(): ModeratorGroup[] {
  return [
    {
      id: "seed-group-1",
      name: "Отряд «Грифон»",
      leader: {
        id: "seed-group-1-leader",
        nickname: "NightShadow",
        position: "Главный Модер",
        nicknameGradient: null,
      },
      members: [
        {
          id: "seed-group-1-member-1",
          nickname: "GreenPanda",
          position: "Модератор",
          nicknameGradient: null,
        },
        {
          id: "seed-group-1-member-2",
          nickname: "DariaHelper",
          position: "Хелпер",
          nicknameGradient: null,
        },
        {
          id: "seed-group-1-member-3",
          nickname: "StormRider",
          position: "Модератор",
          nicknameGradient: null,
        },
        {
          id: "seed-group-1-member-4",
          nickname: "FoxTail",
          position: "Стажёр",
          nicknameGradient: null,
        },
      ],
    },
    {
      id: "seed-group-2",
      name: "Отряд «Феникс»",
      leader: {
        id: "seed-group-2-leader",
        nickname: "VikaTech",
        position: "Тех.Админ",
        nicknameGradient: null,
      },
      members: [
        {
          id: "seed-group-2-member-1",
          nickname: "AlexeyCore",
          position: "Модератор",
          nicknameGradient: null,
        },
        {
          id: "seed-group-2-member-2",
          nickname: "LunaWolf",
          position: "Ст.Хелпер",
          nicknameGradient: null,
        },
        {
          id: "seed-group-2-member-3",
          nickname: "IcePhoenix",
          position: "Хелпер",
          nicknameGradient: null,
        },
        {
          id: "seed-group-2-member-4",
          nickname: "RedBlade",
          position: "Стажёр",
          nicknameGradient: null,
        },
      ],
    },
    {
      id: "seed-group-3",
      name: "Отряд «Дракон»",
      leader: {
        id: "seed-group-3-leader",
        nickname: "SilverDragon",
        position: "Куратор",
        nicknameGradient: null,
      },
      members: [
        {
          id: "seed-group-3-member-1",
          nickname: "DarkAngel",
          position: "Модератор",
          nicknameGradient: null,
        },
        {
          id: "seed-group-3-member-2",
          nickname: "NeonGhost",
          position: "Хелпер",
          nicknameGradient: null,
        },
        {
          id: "seed-group-3-member-3",
          nickname: "GoldenAxe",
          position: "Модератор",
          nicknameGradient: null,
        },
        {
          id: "seed-group-3-member-4",
          nickname: "MistyFox",
          position: "Стажёр",
          nicknameGradient: null,
        },
      ],
    },
  ];
}

export function loadGroupsData(): GroupsData {
  if (!isBrowser()) return { version: 2, groups: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded: GroupsData = { version: 2, groups: seedGroups() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as {
      version: 1 | 2;
      groups?: Array<{
        id: string;
        name: string;
        leader?: {
          id: string;
          nickname: string;
          position: string;
          nicknameGradient?: string | null;
        };
        members?: Array<{
          id: string;
          nickname: string;
          position: string;
          nicknameGradient?: string | null;
        }>;
      }>;
    };
    if (
      !parsed ||
      (parsed.version !== 1 && parsed.version !== 2) ||
      !Array.isArray(parsed.groups)
    ) {
      return { version: 2, groups: [] };
    }
    const migrated: GroupsData = {
      version: 2,
      groups: parsed.groups.map((group) => ({
        id: group.id,
        name: group.name ?? "",
        leader: {
          id: group.leader?.id ?? `${group.id}-leader`,
          nickname: group.leader?.nickname ?? "",
          position: group.leader?.position ?? "",
          nicknameGradient: group.leader?.nicknameGradient ?? null,
        },
        members: (group.members ?? []).map((member) => ({
          id: member.id,
          nickname: member.nickname,
          position: member.position,
          nicknameGradient: member.nicknameGradient ?? null,
        })),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return { version: 2, groups: [] };
  }
}

function saveGroupsData(data: GroupsData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function subscribeGroupsStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function refreshSnapshot(): void {
  cachedGroups = loadGroupsData().groups;
  for (const listener of listeners) {
    listener();
  }
}

export function getGroupsSnapshot(): ModeratorGroup[] {
  if (cachedGroups === null) {
    cachedGroups = loadGroupsData().groups;
  }
  return cachedGroups;
}

export function getGroupsServerSnapshot(): ModeratorGroup[] {
  return EMPTY_GROUPS;
}

function validateGroup(input: GroupInput): string | null {
  if (input.name.trim().length < 2) {
    return "Название группы слишком короткое";
  }
  if (input.leader.nickname.trim().length < 2) {
    return "Ник лидера слишком короткий";
  }
  if (!input.leader.position) {
    return "Укажите должность лидера";
  }
  for (const member of input.members) {
    if (member.nickname.trim().length < 2) {
      return "Ник модератора слишком короткий";
    }
    if (!member.position) {
      return "Укажите должность каждого модератора";
    }
  }
  return null;
}

function buildGroup(input: GroupInput, id: string): ModeratorGroup {
  return {
    id,
    name: input.name.trim(),
    leader: {
      id: `${id}-leader`,
      nickname: input.leader.nickname.trim(),
      position: input.leader.position,
      nicknameGradient: input.leader.nicknameGradient ?? null,
    },
    members: input.members.map((member) => ({
      id: generateId(),
      nickname: member.nickname.trim(),
      position: member.position,
      nicknameGradient: member.nicknameGradient ?? null,
    })),
  };
}

export function addGroup(input: GroupInput): Result<ModeratorGroup> {
  const error = validateGroup(input);
  if (error !== null) {
    return { ok: false, error };
  }
  const data = loadGroupsData();
  const group = buildGroup(input, generateId());
  data.groups.push(group);
  saveGroupsData(data);
  refreshSnapshot();
  return { ok: true, data: group };
}

export function updateGroup(
  id: string,
  input: GroupInput
): Result<ModeratorGroup> {
  const data = loadGroupsData();
  const index = data.groups.findIndex((group) => group.id === id);
  if (index === -1) {
    return { ok: false, error: "Группа не найдена" };
  }
  const error = validateGroup(input);
  if (error !== null) {
    return { ok: false, error };
  }
  const updated = buildGroup(input, id);
  data.groups[index] = updated;
  saveGroupsData(data);
  refreshSnapshot();
  return { ok: true, data: updated };
}

export function removeGroup(id: string): Result {
  const data = loadGroupsData();
  if (!data.groups.some((group) => group.id === id)) {
    return { ok: false, error: "Группа не найдена" };
  }
  data.groups = data.groups.filter((group) => group.id !== id);
  saveGroupsData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}
