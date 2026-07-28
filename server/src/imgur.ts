import { env } from "./env.js";

export const imgurEnabled = (): boolean => env.IMGUR_CLIENT_ID.length > 0;

export class ImgurError extends Error {}

/** Imgur's upload ceiling for non-animated images. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Strips an optional `data:image/png;base64,` prefix and validates the payload. */
export function normalizeBase64Image(data: string): string {
  const base64 = data.replace(/^data:[^;,]*;base64,/i, "").replace(/\s/g, "");

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new ImgurError("Image data is not valid base64");
  }

  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) {
    throw new ImgurError("Image is larger than 10 MB");
  }

  return base64;
}

/**
 * Uploads a base64 image to Imgur anonymously and returns the hosted link.
 * Callers should check `imgurEnabled()` first for a friendlier error.
 */
export async function uploadToImgur(base64: string, filename?: string): Promise<string> {
  if (!imgurEnabled()) {
    throw new ImgurError("Imgur uploads are not configured (set IMGUR_CLIENT_ID)");
  }

  const form = new FormData();
  form.append("image", base64);
  form.append("type", "base64");
  if (filename) form.append("name", filename);

  let res: Response;
  try {
    res = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: { Authorization: `Client-ID ${env.IMGUR_CLIENT_ID}` },
      body: form,
    });
  } catch {
    throw new ImgurError("Could not reach Imgur");
  }

  const payload = (await res.json().catch(() => null)) as
    | { success?: boolean; data?: { link?: string; error?: unknown } }
    | null;

  if (!res.ok || !payload?.success || !payload.data?.link) {
    const raw = payload?.data?.error;
    const detail =
      typeof raw === "string"
        ? raw
        : raw && typeof raw === "object" && "message" in raw && typeof raw.message === "string"
          ? raw.message
          : `Imgur responded with ${res.status}`;
    throw new ImgurError(`Imgur upload failed: ${detail}`);
  }

  return payload.data.link;
}
