import type { Rarity } from "../lib/rarity";

export type Luner = {
    id: number;
    name: string;
    rarity: Rarity;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
};

export type RarityStat = {
    rarity: Rarity;
    count: number;
    dropRate: number;
    points: number;
};

export type Stats = { total: number; byRarity: RarityStat[] };

export type Session = { authenticated: boolean; imgurEnabled: boolean };

export type SortKey = "rarity" | "rarity-asc" | "name" | "newest" | "oldest";

export type LunerInput = { name: string; rarity: Rarity; imageUrl: string };