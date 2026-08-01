import axios, { type AxiosError } from "axios";
import type { Rarity } from "./rarity";
import type { Luner, LunerInput, Session, SortKey, Stats } from "../types/type";

const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

interface ApiError {
    error: string;
}

function getErrorMessage(err: unknown): string {
    const error = err as AxiosError<ApiError>;
    if (error.code === "ERR_NETWORK") {
        return "Cannot reach the server. Is it running?";
    }
    return error.response?.data?.error ?? "Something went wrong";
}

export async function getSession(): Promise<Session> {
    try {
        const response = await api.get<Session>("/auth/me");
        return response.data;
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

export async function login(password: string): Promise<{ authenticated: boolean }> {
    try {
        const response = await api.post<{ authenticated: boolean }>("/auth/login", { password });
        return response.data;
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

export async function logout(): Promise<{ authenticated: boolean }> {
    try {
        const response = await api.post<{ authenticated: boolean }>("/auth/logout");
        return response.data;
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

export async function getAllLuners(params: {
    q?: string;
    rarity?: Rarity | "";
    sort: SortKey;
}): Promise<Luner[]> {
    try {
        const response = await api.get<{ luners: Luner[] }>("/luners", {
            params: {
                sort: params.sort,
                q: params.q || undefined,
                rarity: params.rarity || undefined,
            },
        });
        return response.data.luners;
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

export async function getStats(): Promise<Stats> {
    try {
        const response = await api.get<Stats>("/luners/stats");
        return response.data;
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

export async function addLuner(input: LunerInput): Promise<Luner> {
    try {
        const response = await api.post<{ luner: Luner }>("/luners", input);
        return response.data.luner;
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

export async function updateLuner(id: number, input: Partial<LunerInput>): Promise<Luner> {
    try {
        const response = await api.patch<{ luner: Luner }>(`/luners/${id}`, input);
        return response.data.luner;
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

export async function deleteLuner(id: number): Promise<void> {
    try {
        await api.delete(`/luners/${id}`);
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

export async function uploadImage(file: File): Promise<string> {
    const data = await fileToBase64(file);
    try {
        const response = await api.post<{ imageUrl: string }>("/luners/upload", {
            data,
            filename: file.name,
        });
        return response.data.imageUrl;
    } catch (err) {
        throw new Error(getErrorMessage(err), {
            cause: err,
        });
    }
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read that file"));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
    });
}

export default api;