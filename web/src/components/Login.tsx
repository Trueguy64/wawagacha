import { useState } from "react";
import { ApiError, api } from "../lib/api";

export function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
    <form onSubmit={submit} className="flex flex-col w-full max-w-md gap-5 rounded-3xl border-4 border-gray-300 p-8">
      <div>
        <h1>Wawagacha Admin</h1>
        <p className="muted">Manage the luner pool</p>
      </div>

      <div>
        <label htmlFor="password" className="muted">
          Admin password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          className="w-full box-border" 
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <button type="submit" className="primary" disabled={busy || password.length === 0}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
    </div>
  );
}
