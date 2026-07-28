import type { Luner } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { RARITIES, type Rarity, rarityDropRate } from "../rarity.js";

export const ROLL_COOLDOWN_MS = 18 * 60 * 60 * 1000;

export type PoolEntry = { rarity: Rarity; weight: number; lunerIds: number[] };


export async function buildPool(): Promise<PoolEntry[]> {
  const luners = await prisma.luner.findMany({ select: { id: true, rarity: true } });

  const byRarity = new Map<string, number[]>();
  for (const luner of luners) {
    const ids = byRarity.get(luner.rarity);
    if (ids) ids.push(luner.id);
    else byRarity.set(luner.rarity, [luner.id]);
  }

  return RARITIES.filter((r) => byRarity.has(r.name)).map((r) => ({
    rarity: r.name,
    weight: rarityDropRate(r.name),
    lunerIds: byRarity.get(r.name)!,
  }));
}

/** Weighted pick over the pool. `random` is injectable so this can be tested. */
export function pickRarity(pool: PoolEntry[], random: () => number = Math.random): Rarity {
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let ticket = random() * total;

  for (const entry of pool) {
    ticket -= entry.weight;
    if (ticket < 0) return entry.rarity;
  }

  // Only reachable through floating-point drift at the very top of the range.
  return pool[pool.length - 1].rarity;
}

export type Draw = { luner: Luner; copiesOwned: number };

/** Picks a card from the pool and records the pull.*/
async function draw(playerId: string, pool: PoolEntry[]): Promise<Draw> {
  const rarity = pickRarity(pool);
  const entry = pool.find((e) => e.rarity === rarity)!;
  const lunerId = entry.lunerIds[Math.floor(Math.random() * entry.lunerIds.length)];

  await prisma.pull.create({ data: { playerId, lunerId } });

  const [luner, copiesOwned] = await Promise.all([
    prisma.luner.findUniqueOrThrow({ where: { id: lunerId } }),
    prisma.pull.count({ where: { playerId, lunerId } }),
  ]);

  return { luner, copiesOwned };
}

export type RollResult =
  | { status: "ok"; luner: Luner; copiesOwned: number; nextRollAt: Date }
  | { status: "cooldown"; nextRollAt: Date }
  | { status: "empty-pool" };

/**
 * Performs one roll for a player, enforcing the 18-hour cooldown.
 *
 * The cooldown is claimed with a conditional update so two /roll invocations
 * racing each other can't both win. The pool is checked *before* the claim so a
 * misconfigured card pool never costs someone 18 hours.
 */
export async function rollForPlayer(playerId: string, username: string): Promise<RollResult> {
  const pool = await buildPool();
  if (pool.length === 0) return { status: "empty-pool" };

  const player = await prisma.player.upsert({
    where: { id: playerId },
    update: { username },
    create: { id: playerId, username },
  });

  const now = new Date();
  const cutoff = new Date(now.getTime() - ROLL_COOLDOWN_MS);

  const claimed = await prisma.player.updateMany({
    where: {
      id: playerId,
      OR: [{ lastRollAt: null }, { lastRollAt: { lte: cutoff } }],
    },
    data: { lastRollAt: now },
  });

  if (claimed.count === 0) {
    const lastRollAt = player.lastRollAt ?? now;
    return { status: "cooldown", nextRollAt: new Date(lastRollAt.getTime() + ROLL_COOLDOWN_MS) };
  }

  try {
    const { luner, copiesOwned } = await draw(playerId, pool);
    return {
      status: "ok",
      luner,
      copiesOwned,
      nextRollAt: new Date(now.getTime() + ROLL_COOLDOWN_MS),
    };
  } catch (error) {
    // Hand the cooldown back rather than charging for a roll that didn't land.
    await prisma.player.update({
      where: { id: playerId },
      data: { lastRollAt: player.lastRollAt },
    });
    throw error;
  }
}

export type BulkRollResult = { status: "ok"; draws: Draw[] } | { status: "empty-pool" };

/**
 * xroll: no cooldown is checked and none is claimed, so the player's
 * normal /roll timer is left as it was.
 */
export async function rollManyForPlayer(
  playerId: string,
  username: string,
  times: number,
): Promise<BulkRollResult> {
  const pool = await buildPool();
  if (pool.length === 0) return { status: "empty-pool" };

  await prisma.player.upsert({
    where: { id: playerId },
    update: { username },
    create: { id: playerId, username },
  });

  // ponytail: sequential draws, fine for the /xroll cap, batch the writes if it ever rises.
  const draws: Draw[] = [];
  for (let i = 0; i < times; i++) draws.push(await draw(playerId, pool));
  return { status: "ok", draws };
}
