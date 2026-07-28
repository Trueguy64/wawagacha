import { useRef, useState } from "react";
import { ApiError, api, type Luner, type LunerInput } from "../lib/api";
import { RARITIES_DESC, type Rarity } from "../lib/rarity";
import { Modal } from "./Modal";

type Props = {
  /** Present when editing, absent when creating. */
  luner: Luner | null;
  imgurEnabled: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function LunerForm({ luner, imgurEnabled, onClose, onSaved }: Props) {
  const [name, setName] = useState(luner?.name ?? "");
  const [rarity, setRarity] = useState<Rarity>(luner?.rarity ?? "Common");
  const [imageUrl, setImageUrl] = useState(luner?.imageUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: LunerInput = { name: name.trim(), rarity, imageUrl: imageUrl.trim() };
    if (!input.name) return setError("Name is required");
    if (!/^https?:\/\//i.test(input.imageUrl)) {
      return setError("Image link must be a URL starting with http:// or https://");
    }

    setBusy(true);
    try {
      if (luner) {
        await api.updateLuner(luner.id, input);
        onSaved(`Updated “${input.name}”`);
      } else {
        await api.createLuner(input);
        onSaved(`Added “${input.name}”`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this luner");
    } finally {
      setBusy(false);
    }
  }


  return (
    <Modal title={luner ? `Edit luner #${luner.id}` : "Add a luner"} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <div>
          <label htmlFor="name" className="muted">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            autoFocus
            maxLength={64}
            onChange={(e) => setName(e.target.value)}
            placeholder="Angry luner"
          />
        </div>

        <div>
          <p className="muted">Rarity</p>
          <div className="row">
            {RARITIES_DESC.map((r) => (
              <button
                key={r.name}
                type="button"
                data-rarity={r.name}
                aria-pressed={rarity === r.name}
                onClick={() => setRarity(r.name)}
              >
                {r.name} · {r.points}p
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="imageUrl" className="muted">
            Image link
          </label>
          <input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://i.imgur.com/…"
          />
        </div>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview"
            style={{ maxHeight: "14rem", margin: "0 auto" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            onLoad={(e) => {
              e.currentTarget.style.display = "";
            }}
          />
        )}

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Saving…" : luner ? "Save changes" : "Add luner"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
