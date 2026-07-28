import type { Stats } from "../lib/api";

/** Per-rarity counts, highest rarity first. */
export function StatStrip({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  return (
    <p className="muted">
      <strong>{stats.total}</strong> luners ·{" "}
      {[...stats.byRarity].reverse().map((stat, i) => (
        <span key={stat.rarity}>
          {i > 0 && " | "}
          <span data-rarity={stat.rarity}>{stat.rarity}</span> {stat.count} ({stat.dropRate}%,{" "}
          {stat.points} pts)
        </span>
      ))}
    </p>
  );
}
