import { prisma } from "../prisma/client.js";
import { RARITIES, type Rarity, rarityPoints } from "../rarity.js";

export type CollectionCard = {
  lunerId: number;
  name: string;
  rarity: Rarity;
  quantity: number;
  points: number;
};

export type Collection = {
  cards: CollectionCard[];
  totalCards: number;
  uniqueCards: number;
  totalPoints: number;
  /** Card count per rarity, highest rarity first. */
  byRarity: { rarity: Rarity; unique: number; total: number }[];
};

/** A player's cards, grouped by luner and ordered by rarity then name. */
export async function getCollection(playerId: string): Promise<Collection> {
  const grouped = await prisma.pull.groupBy({
    by: ["lunerId"],
    where: { playerId },
    _count: { _all: true },
  });

  const luners = await prisma.luner.findMany({
    where: { id: { in: grouped.map((g) => g.lunerId) } },
    select: { id: true, name: true, rarity: true },
  });
  const lunerById = new Map(luners.map((l) => [l.id, l]));

  const cards: CollectionCard[] = [];
  for (const group of grouped) {
    const luner = lunerById.get(group.lunerId);
    if (!luner) continue; // deleted from the pool between the two queries
    const quantity = group._count._all;
    cards.push({
      lunerId: luner.id,
      name: luner.name,
      rarity: luner.rarity as Rarity,
      quantity,
      points: rarityPoints(luner.rarity) * quantity,
    });
  }

  const rank = new Map(RARITIES.map((r) => [r.name, r.order]));
  cards.sort(
    (a, b) =>
      (rank.get(b.rarity) ?? -1) - (rank.get(a.rarity) ?? -1) || a.name.localeCompare(b.name),
  );

  return {
    cards,
    totalCards: cards.reduce((sum, c) => sum + c.quantity, 0),
    uniqueCards: cards.length,
    totalPoints: cards.reduce((sum, c) => sum + c.points, 0),
    byRarity: [...RARITIES]
      .reverse()
      .map((r) => {
        const owned = cards.filter((c) => c.rarity === r.name);
        return {
          rarity: r.name,
          unique: owned.length,
          total: owned.reduce((sum, c) => sum + c.quantity, 0),
        };
      })
      .filter((row) => row.total > 0),
  };
}

export type LeaderboardRow = {
  playerId: string;
  username: string;
  points: number;
  cards: number;
};

export function dayStart(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
}

// Regenerates every Monday
export function weekStart(now: Date = new Date()): Date {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

export async function getLeaderboard(since?: Date, until?: Date): Promise<LeaderboardRow[]> {
  const pulls = await prisma.pull.findMany({
    where: (since || until) ? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } } : undefined,
    select: { playerId: true, luner: { select: { rarity: true } } },
  });

  const totals = new Map<string, { points: number; cards: number }>();
  for (const pull of pulls) {
    const row = totals.get(pull.playerId) ?? { points: 0, cards: 0 };
    row.points += rarityPoints(pull.luner.rarity);
    row.cards += 1;
    totals.set(pull.playerId, row);
  }

  if (totals.size === 0) return [];

  const players = await prisma.player.findMany({
    where: { id: { in: [...totals.keys()] } },
    select: { id: true, username: true },
  });
  const usernameById = new Map(players.map((p) => [p.id, p.username]));

  return [...totals.entries()]
    .map(([playerId, row]) => ({
      playerId,
      username: usernameById.get(playerId) ?? "Unknown player",
      points: row.points,
      cards: row.cards,
    }))
    .sort((a, b) => b.points - a.points || b.cards - a.cards || a.username.localeCompare(b.username));
}
