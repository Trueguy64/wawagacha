import { z } from "zod";
import { RARITY_NAMES } from "../rarity.js";

const imageUrl = z
  .string()
  .trim()
  .min(1, "Image link is required")
  .url("Image link must be a valid URL")
  .refine((v) => /^https?:\/\//i.test(v), "Image link must start with http:// or https://");

export const lunerCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(64, "Name must be 64 characters or fewer"),
  rarity: z.enum(RARITY_NAMES),
  imageUrl,
});

/** Every field optional, but at least one must be present. */
export const lunerUpdateSchema = lunerCreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "Nothing to update",
);

export const lunerListQuerySchema = z.object({
  q: z.string().trim().max(64).optional(),
  rarity: z.enum(RARITY_NAMES).optional(),
  sort: z.enum(["rarity", "rarity-asc", "name", "newest", "oldest"]).default("rarity"),
});

const INVALID_ID = "Invalid luner id";
export const idParamSchema = z.coerce
  .number({ invalid_type_error: INVALID_ID })
  .int(INVALID_ID)
  .positive(INVALID_ID);

/** Image handed to the Imgur proxy: base64 payload, with or without a data: prefix. ^w^ */
export const uploadSchema = z.object({
  filename: z.string().trim().max(200).optional(),
  data: z.string().min(1, "No image data received"),
});
