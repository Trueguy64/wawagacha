/** Keep in sync with server/src/rarity.ts. */
export const RARITIES = [
  { name: "Common", order: 0, points: 1, dropRate: 50 },
  { name: "Uncommon", order: 1, points: 3, dropRate: 25 },
  { name: "Rare", order: 2, points: 6, dropRate: 12.5 },
  { name: "Epic", order: 3, points: 9, dropRate: 7.5 },
  { name: "Legendary", order: 4, points: 12, dropRate: 3 },
] as const;

export type Rarity = (typeof RARITIES)[number]["name"];

export const RARITY_NAMES = RARITIES.map((r) => r.name) as readonly Rarity[];

/** Highest rarity first — matches the site's default sort. */
export const RARITIES_DESC = [...RARITIES].reverse();

/** Colours live in index.css, keyed on [data-rarity]. */

const byName = new Map(RARITIES.map((r) => [r.name, r]));

export const rarityPoints = (rarity: Rarity): number => byName.get(rarity)?.points ?? 0;
