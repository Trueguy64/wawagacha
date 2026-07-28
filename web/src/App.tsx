import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDelete } from "./components/ConfirmDelete";
import { Login } from "./components/Login";
import { LunerCard } from "./components/LunerCard";
import { LunerForm } from "./components/LunerForm";
import { StatStrip } from "./components/StatStrip";
import { Toolbar } from "./components/Toolbar";
import { ApiError, api, type Luner, type SortKey, type Stats } from "./lib/api";
import { RARITIES_DESC, type Rarity } from "./lib/rarity";
import { Feet } from "./components/Feet";

type Auth = "loading" | "out" | "in";

export default function App() {
  const [auth, setAuth] = useState<Auth>("loading");
  const [imgurEnabled, setImgurEnabled] = useState(false);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [rarity, setRarity] = useState<Rarity | "">("");
  const [sort, setSort] = useState<SortKey>("rarity");

  const [luners, setLuners] = useState<Luner[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formFor, setFormFor] = useState<{ luner: Luner | null } | null>(null);
  const [deleteFor, setDeleteFor] = useState<Luner | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api
      .session()
      .then((session) => {
        setImgurEnabled(session.imgurEnabled);
        setAuth(session.authenticated ? "in" : "out");
      })
      .catch(() => setAuth("out"));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, counts] = await Promise.all([
        api.listLuners({ q: debouncedQuery, rarity, sort }),
        api.stats(),
      ]);
      setLuners(list.luners);
      setStats(counts);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuth("out");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load luners");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, rarity, sort]);

  useEffect(() => {
    if (auth === "in") void refresh();
  }, [auth, refresh]);

  const toastTimer = useRef<number | null>(null);
  const flash = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  /** When sorted by rarity, render one titled section per tier. */
  const sections = useMemo(() => {
    if (!sort.startsWith("rarity")) return null;
    const order = sort === "rarity" ? RARITIES_DESC : [...RARITIES_DESC].reverse();
    return order
      .map((r) => ({ rarity: r.name, items: luners.filter((l) => l.rarity === r.name) }))
      .filter((section) => section.items.length > 0);
  }, [luners, sort]);

  if (auth === "loading") {
    return <p className="muted">Loading…</p>;
  }

  if (auth === "out") {
    return <Login onSignedIn={() => setAuth("in")} />;
  }

  const cardProps = {
    onEdit: (luner: Luner) => setFormFor({ luner }),
    onDelete: (luner: Luner) => setDeleteFor(luner),
  };

  return (
    <>
      <header className="row" style={{ justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1>Wawagacha Admin Panel</h1>
        </div>
        <button
          type="button"
          onClick={async () => {
            await api.logout().catch(() => undefined);
            setAuth("out");
          }}
        >
          Sign out
        </button>
      </header>

      <div className="stack">
        <StatStrip stats={stats} />

        <Toolbar
          query={query}
          onQuery={setQuery}
          rarity={rarity}
          onRarity={setRarity}
          sort={sort}
          onSort={setSort}
          onAdd={() => setFormFor({ luner: null })}
        />

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        {loading && luners.length === 0 ? (
          <p className="muted">Loading luners…</p>
        ) : luners.length === 0 ? (
          <EmptyState
            filtered={Boolean(debouncedQuery || rarity)}
            onAdd={() => setFormFor({ luner: null })}
          />
        ) : sections ? (
          <div className="stack">
            {sections.map((section) => (
              <section key={section.rarity}>
                <h2 data-rarity={section.rarity} style={{ marginBottom: "0.5rem" }}>
                  {section.rarity} <span className="muted">({section.items.length})</span>
                </h2>
                <Grid>
                  {section.items.map((luner) => (
                    <LunerCard key={luner.id} luner={luner} {...cardProps} />
                  ))}
                </Grid>
              </section>
            ))}
          </div>
        ) : (
          <Grid>
            {luners.map((luner) => (
              <LunerCard key={luner.id} luner={luner} {...cardProps} />
            ))}
          </Grid>
        )}
      </div>

      {formFor && (
        <LunerForm
          luner={formFor.luner}
          imgurEnabled={imgurEnabled}
          onClose={() => setFormFor(null)}
          onSaved={(message) => {
            setFormFor(null);
            flash(message);
            void refresh();
          }}
        />
      )}

      {deleteFor && (
        <ConfirmDelete
          luner={deleteFor}
          onClose={() => setDeleteFor(null)}
          onDeleted={(message) => {
            setDeleteFor(null);
            flash(message);
            void refresh();
          }}
        />
      )}

      {toast && (
        <p role="status" className="toast">
          {toast}
        </p>
      )}
      <Feet/>
    </>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid">{children}</div>;
}

function EmptyState({ filtered, onAdd }: { filtered: boolean; onAdd: () => void }) {
  return (
    <div className="stack center" style={{ padding: "3rem 0" }}>
      <p>{filtered ? "No luners match those filters." : "No luners yet."}</p>
      {!filtered && (
        <button type="button" className="primary" onClick={onAdd} style={{ margin: "0 auto" }}>
          + Add your first luner
        </button>
      )}
    </div>
  );
}
