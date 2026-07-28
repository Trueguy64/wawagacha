import type { Rarity } from "./rarity";

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

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: "same-origin",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    throw new ApiError("Cannot reach the server — is it running?", 0);
  }

  if (res.status === 204) return undefined as T;

  const body = (await res.json().catch(() => null)) as { error?: string } | null;

  if (!res.ok) {
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  }

  return body as T;
}

export const api = {
  session: () => request<Session>("/api/auth/me"),

  login: (password: string) =>
    request<{ authenticated: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  logout: () => request<{ authenticated: boolean }>("/api/auth/logout", { method: "POST" }),

  listLuners: (params: { q?: string; rarity?: Rarity | ""; sort: SortKey }) => {
    const search = new URLSearchParams({ sort: params.sort });
    if (params.q) search.set("q", params.q);
    if (params.rarity) search.set("rarity", params.rarity);
    return request<{ luners: Luner[] }>(`/api/luners?${search}`);
  },

  stats: () => request<Stats>("/api/luners/stats"),

  createLuner: (input: LunerInput) =>
    request<{ luner: Luner }>("/api/luners", { method: "POST", body: JSON.stringify(input) }),

  updateLuner: (id: number, input: Partial<LunerInput>) =>
    request<{ luner: Luner }>(`/api/luners/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteLuner: (id: number) => request<void>(`/api/luners/${id}`, { method: "DELETE" }),

  uploadImage: (file: File) =>
    fileToBase64(file).then((data) =>
      request<{ imageUrl: string }>("/api/luners/upload", {
        method: "POST",
        body: JSON.stringify({ data, filename: file.name }),
      }),
    ),
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ApiError("Could not read that file", 0));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
