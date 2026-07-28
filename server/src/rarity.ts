/**
 * rarity table for gacha.
 *
 * `order` is ascending-by-value and is what the admin site sorts on.
 * `dropRate` is the base pull weight (percent) and `points` the leaderboard
 * value of owning one card of that rarity.
 *
 * keep this in sync with web/src/lib/rarity.ts. :3
 */
export const RARITIES = [
  { name: "Common", order: 0, points: 1, dropRate: 51 },
  { name: "Uncommon", order: 1, points: 3, dropRate: 25.5 },
  { name: "Rare", order: 2, points: 6, dropRate: 13 },
  { name: "Epic", order: 3, points: 9, dropRate: 7.5 },
  { name: "Legendary", order: 4, points: 12, dropRate: 3 },
] as const;

export type Rarity = (typeof RARITIES)[number]["name"];

export const RARITY_NAMES = RARITIES.map((r) => r.name) as unknown as [Rarity, ...Rarity[]];

const byName = new Map(RARITIES.map((r) => [r.name, r]));

export function rarityOrder(rarity: string): number {
  return byName.get(rarity as Rarity)?.order ?? -1;
}

export function rarityPoints(rarity: string): number {
  return byName.get(rarity as Rarity)?.points ?? 0;
}

/** Relative pull weight. Weights are normalised over whatever is in the pool,
 *  so the table not summing to exactly 100 does not matter!!!!! */
export function rarityDropRate(rarity: string): number {
  return byName.get(rarity as Rarity)?.dropRate ?? 0;
}
