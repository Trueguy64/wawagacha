import type { Rarity } from "../rarity.js";

/** Embed accent colours, matching the admin site's rarity palette. */
const RARITY_COLOR: Record<Rarity, number> = {
  Common: 0x94a3b8,
  Uncommon: 0x34d399,
  Rare: 0x38bdf8,
  Epic: 0xe879f9,
  Legendary: 0xfbbf24,
};

const RARITY_EMOJI: Record<Rarity, string> = {
  Common: "⚪",
  Uncommon: "🟢",
  Rare: "🔵",
  Epic: "🟣",
  Legendary: "🟡",
};

// Accept plain strings: rarity comes off the database as a String column, and an
// unrecognised value should fall back rather than fail to render.
export const rarityColor = (rarity: string): number => RARITY_COLOR[rarity as Rarity] ?? 0x8b5cf6;
export const rarityEmoji = (rarity: string): string => RARITY_EMOJI[rarity as Rarity] ?? "🌙";

export const MEDALS = ["🥇", "🥈", "🥉"];

/** Discord renders these client-side in each viewer's own timezone. */
export const relativeTime = (date: Date): string => `<t:${Math.floor(date.getTime() / 1000)}:R>`;
export const shortDate = (date: Date): string => `<t:${Math.floor(date.getTime() / 1000)}:d>`;
