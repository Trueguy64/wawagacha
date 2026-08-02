import axios from "axios";
import type { Rarity } from "./rarity";
import type { Luner, LunerInput, Session, SortKey, Stats } from "../types/type";

export type { Luner, LunerInput, Session, SortKey, Stats };

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
    timeout: 15_000,
});

export class ApiError extends Error {
    public status?: number;
    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}

function toApiError(err: unknown): ApiError {
    if (err instanceof ApiError) {
        return err;
    }
    if (axios.isAxiosError<{ error?: string }>(err)) {
        if (err.code === "ERR_NETWORK") {
            return new ApiError("Cannot reach the server. Is it running?");
        }
        if (err.code === "ECONNABORTED") {
            return new ApiError("The server took too long to respond.");
        }
        return new ApiError(err.response?.data?.error ?? "Something went wrong", err.response?.status);
    }
    return new ApiError(err instanceof Error ? err.message : "Something went wrong");
}

client.interceptors.response.use(
    (res) => res,
    (err) => Promise.reject(axios.isCancel(err) ? err : toApiError(err)),
);

async function getSession(): Promise<Session> {
    const { data } = await client.get<Session>("/auth/me");
    return data;
}

async function login(password: string): Promise<{ authenticated: boolean }> {
    const { data } = await client.post<{ authenticated: boolean }>("/auth/login", { password });
    return data;
}

async function logout(): Promise<{ authenticated: boolean }> {
    const { data } = await client.post<{ authenticated: boolean }>("/auth/logout");
    return data;
}

async function listLuners(
    params: { q?: string; rarity?: Rarity | ""; sort: SortKey },
    signal?: AbortSignal,
): Promise<Luner[]> {
    const { data } = await client.get<{ luners: Luner[] }>("/luners", {
        params: {
            sort: params.sort,
            q: params.q || undefined,
            rarity: params.rarity || undefined,
        },
        signal,
    });
    return data.luners;
}

async function getStats(): Promise<Stats> {
    const { data } = await client.get<Stats>("/luners/stats");
    return data;
}

async function createLuner(input: LunerInput): Promise<Luner> {
    const { data } = await client.post<{ luner: Luner }>("/luners", input);
    return data.luner;
}

async function updateLuner(id: number, input: Partial<LunerInput>): Promise<Luner> {
    const { data } = await client.patch<{ luner: Luner }>(`/luners/${id}`, input);
    return data.luner;
}

async function deleteLuner(id: number): Promise<void> {
    await client.delete(`/luners/${id}`);
}

async function uploadImage(file: File): Promise<string> {
    const { data } = await client.post<{ imageUrl: string }>(
        "/luners/upload",
        { data: await fileToBase64(file), filename: file.name },
        { timeout: 60_000 },
    );
    return data.imageUrl;
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new ApiError("Could not read that file"));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
    });
}

export const api = {
    session: getSession,
    login,
    logout,
    listLuners,
    stats: getStats,
    createLuner,
    updateLuner,
    deleteLuner,
    uploadImage,
};