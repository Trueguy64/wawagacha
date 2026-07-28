import type { SortKey } from "../lib/api";
import { RARITIES_DESC, type Rarity } from "../lib/rarity";

type Props = {
  query: string;
  onQuery: (value: string) => void;
  rarity: Rarity | "";
  onRarity: (value: Rarity | "") => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
  onAdd: () => void;
};

const SORT_LABELS: Record<SortKey, string> = {
  rarity: "Rarity (highest first)",
  "rarity-asc": "Rarity (lowest first)",
  name: "Name (A–Z)",
  newest: "Newest first",
  oldest: "Oldest first",
};

export function Toolbar({ query, onQuery, rarity, onRarity, sort, onSort, onAdd }: Props) {
  return (
    <div className="stack" style={{ gap: "0.5rem" }}>
      <div className="row">
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search luners…"
          aria-label="Search luners by name"
        />

        <select
          value={sort}
          aria-label="Sort by"
          onChange={(e) => onSort(e.target.value as SortKey)}
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>

        <button type="button" className="primary" onClick={onAdd}>
          + Add luner
        </button>
      </div>

      <div className="row">
        <button type="button" aria-pressed={rarity === ""} onClick={() => onRarity("")}>
          All rarities
        </button>
        {RARITIES_DESC.map((r) => (
          <button
            key={r.name}
            type="button"
            data-rarity={r.name}
            aria-pressed={rarity === r.name}
            onClick={() => onRarity(rarity === r.name ? "" : r.name)}
          >
            {r.name}
          </button>
        ))}
      </div>
    </div>
  );
}
