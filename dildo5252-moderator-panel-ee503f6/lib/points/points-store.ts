import type { Result } from "@/lib/auth/auth-store";
import { POSITIONS } from "@/lib/data";
import { listTeamMembers } from "@/lib/team/team-store";

export type ShopItem = {
  id: string;
  name: string;
  cost: number;
  description: string;
};

export type PointsData = {
  version: 1;
  salaries: Record<string, number>;
  shopItems: ShopItem[];
  memberPoints: Record<string, number>;
};

const STORAGE_KEY = "mod-panel-points-v1";

const EMPTY_DATA: PointsData = {
  version: 1,
  salaries: {},
  shopItems: [],
  memberPoints: {},
};

const listeners = new Set<() => void>();

let cachedData: PointsData | null = null;

const DEFAULT_SALARIES: Record<string, number> = {
  Владелец: 0,
  Админ: 600,
  Куратор: 550,
  "Тех.Админ": 500,
  "Тех.Админ ДС": 500,
  "Гл.Билдер": 450,
  "Зам.Билдер": 420,
  "Ст.Билдер": 390,
  Билдер: 360,
  "Главный Модер": 480,
  Модератор: 400,
  "Ст.Хелпер": 320,
  Хелпер: 250,
  Стажёр: 150,
};

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  {
    id: "seed-shop-1",
    name: "Смена ника на месяц",
    cost: 1000,
    description:
      "Разовое переименование игрового ника по согласованию с администрацией.",
  },
  {
    id: "seed-shop-2",
    name: "Цветной ник в чате",
    cost: 800,
    description:
      "Выделение вашего ника фирменным цветом в чате сервера на 30 дней.",
  },
  {
    id: "seed-shop-3",
    name: "Титул «Легенда»",
    cost: 1500,
    description:
      "Персональный титул перед ником, который видят все игроки проекта.",
  },
  {
    id: "seed-shop-4",
    name: "Приватный остров",
    cost: 2000,
    description:
      "Личный закрытый остров для строительства без доступа посторонних.",
  },
  {
    id: "seed-shop-5",
    name: "Кейс с привилегиями",
    cost: 1200,
    description:
      "Случайная привилегия из набора: кит, эмоция, декоративный питомец.",
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function generateId(): string {
  return crypto.randomUUID();
}

function normalizePoints(value: number): number {
  return Math.max(0, Math.floor(value));
}

function seedSalaries(): Record<string, number> {
  const salaries: Record<string, number> = {};
  for (const position of POSITIONS) {
    salaries[position] = DEFAULT_SALARIES[position] ?? 0;
  }
  return salaries;
}

function seedShopItems(): ShopItem[] {
  return DEFAULT_SHOP_ITEMS.map((item) => ({ ...item }));
}

function seedMemberPoints(): Record<string, number> {
  const points: Record<string, number> = {};
  listTeamMembers().forEach((member, index) => {
    const base = DEFAULT_SALARIES[member.position] ?? 150;
    points[member.id] = base + index * 25;
  });
  return points;
}

export function loadPointsData(): PointsData {
  if (!isBrowser()) return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded: PointsData = {
        version: 1,
        salaries: seedSalaries(),
        shopItems: seedShopItems(),
        memberPoints: seedMemberPoints(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as PointsData;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !parsed.salaries ||
      typeof parsed.salaries !== "object" ||
      !Array.isArray(parsed.shopItems) ||
      !parsed.memberPoints ||
      typeof parsed.memberPoints !== "object"
    ) {
      return EMPTY_DATA;
    }
    return parsed;
  } catch {
    return EMPTY_DATA;
  }
}

function savePointsData(data: PointsData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function subscribePointsStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function refreshSnapshot(): void {
  cachedData = loadPointsData();
  for (const listener of listeners) {
    listener();
  }
}

export function getPointsSnapshot(): PointsData {
  if (cachedData === null) {
    cachedData = loadPointsData();
  }
  return cachedData;
}

export function getPointsServerSnapshot(): PointsData {
  return EMPTY_DATA;
}

export function getPositionSalary(data: PointsData, position: string): number {
  return normalizePoints(data.salaries[position]);
}

export function getMemberPointsValue(
  data: PointsData,
  memberId: string
): number {
  return normalizePoints(data.memberPoints[memberId]);
}

export function updateSalary(position: string, points: number): Result {
  const data = loadPointsData();
  if (!POSITIONS.includes(position as (typeof POSITIONS)[number])) {
    return { ok: false, error: "Неизвестная должность" };
  }
  if (!Number.isInteger(points) || points < 0) {
    return { ok: false, error: "Зарплата должна быть целым числом от 0" };
  }
  data.salaries[position] = points;
  savePointsData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}

export function addShopItem(
  name: string,
  cost: number,
  description: string
): Result<ShopItem> {
  const data = loadPointsData();
  if (name.trim().length < 2) {
    return { ok: false, error: "Название товара слишком короткое" };
  }
  if (!Number.isInteger(cost) || cost < 1) {
    return { ok: false, error: "Стоимость должна быть целым числом от 1" };
  }
  const item: ShopItem = {
    id: generateId(),
    name: name.trim(),
    cost,
    description: description.trim(),
  };
  data.shopItems.push(item);
  savePointsData(data);
  refreshSnapshot();
  return { ok: true, data: item };
}

export function updateShopItem(
  id: string,
  name: string,
  cost: number,
  description: string
): Result {
  const data = loadPointsData();
  const index = data.shopItems.findIndex((item) => item.id === id);
  if (index === -1) {
    return { ok: false, error: "Товар не найден" };
  }
  if (name.trim().length < 2) {
    return { ok: false, error: "Название товара слишком короткое" };
  }
  if (!Number.isInteger(cost) || cost < 1) {
    return { ok: false, error: "Стоимость должна быть целым числом от 1" };
  }
  data.shopItems[index] = {
    ...data.shopItems[index],
    name: name.trim(),
    cost,
    description: description.trim(),
  };
  savePointsData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}

export function removeShopItem(id: string): Result {
  const data = loadPointsData();
  if (!data.shopItems.some((item) => item.id === id)) {
    return { ok: false, error: "Товар не найден" };
  }
  data.shopItems = data.shopItems.filter((item) => item.id !== id);
  savePointsData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}

export function setMemberPoints(memberId: string, points: number): Result {
  const data = loadPointsData();
  if (!Number.isInteger(points) || points < 0) {
    return {
      ok: false,
      error: "Количество баллов должно быть целым числом от 0",
    };
  }
  data.memberPoints[memberId] = points;
  savePointsData(data);
  refreshSnapshot();
  return { ok: true, data: undefined };
}
