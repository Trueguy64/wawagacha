import { useState } from "react";
import { ApiError, api, type Luner } from "../lib/api";
import { Modal } from "./Modal";

type Props = {
  luner: Luner;
  onClose: () => void;
  onDeleted: (message: string) => void;
};

export function ConfirmDelete({ luner, onClose, onDeleted }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteLuner(luner.id);
      onDeleted(`Deleted “${luner.name}”`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this luner");
      setBusy(false);
    }
  }

  return (
    <Modal title="Delete luner" onClose={onClose}>
      <div className="stack">
        <p>
          Delete <strong>{luner.name}</strong> (#{luner.id}, {luner.rarity})? This cannot be undone.
        </p>

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
