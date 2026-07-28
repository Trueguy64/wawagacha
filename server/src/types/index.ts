import type { z } from "zod";
import type {
  lunerCreateSchema,
  lunerListQuerySchema,
  lunerUpdateSchema,
} from "../schemas/luner.schema.js";

export type { Rarity } from "../rarity.js";

export type LunerCreateInput = z.infer<typeof lunerCreateSchema>;
export type LunerUpdateInput = z.infer<typeof lunerUpdateSchema>;
export type LunerListQuery = z.infer<typeof lunerListQuerySchema>;
