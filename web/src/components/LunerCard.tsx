import { useState } from "react";
import type { Luner } from "../lib/api";
import { rarityPoints } from "../lib/rarity";

type Props = {
  luner: Luner;
  onEdit: (luner: Luner) => void;
  onDelete: (luner: Luner) => void;
};

export function LunerCard({ luner, onEdit, onDelete }: Props) {
  const [broken, setBroken] = useState(false);

  return (
    <article data-rarity={luner.rarity} style={{ borderColor: "var(--r)" }}>
      {broken ? (
        <p className="noimg">Image failed to load</p>
      ) : (
        <img src={luner.imageUrl} alt={luner.name} loading="lazy" onError={() => setBroken(true)} />
      )}

      <div>
        <div>
          <h3 title={luner.name}>{luner.name}</h3>
          <p className="muted">
            #{luner.id} · {luner.rarity} · {rarityPoints(luner.rarity)} pts
          </p>
        </div>

        <div className="row">
          <button type="button" onClick={() => onEdit(luner)}>
            Edit
          </button>
          <button type="button" className="danger" onClick={() => onDelete(luner)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
