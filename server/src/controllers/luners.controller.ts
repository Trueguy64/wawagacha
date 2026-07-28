import type { Request, Response } from "express";
import { HttpError, validate } from "../http.js";
import { imgurEnabled, normalizeBase64Image, uploadToImgur } from "../imgur.js";
import { prisma } from "../prisma/client.js";
import { RARITIES, rarityOrder } from "../rarity.js";
import {
  idParamSchema,
  lunerCreateSchema,
  lunerListQuerySchema,
  lunerUpdateSchema,
  uploadSchema,
} from "../schemas/luner.schema.js";

/** GET /api/luners, list with search, rarity filter and sorting. */
export async function list(req: Request, res: Response): Promise<void> {
  const { q, rarity, sort } = validate(lunerListQuerySchema, req.query, "Invalid query");

  const luners = await prisma.luner.findMany({
    where: {
      ...(rarity ? { rarity } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
  });

  // Rarity is a String column, so its ranking lives in code rather than SQL.
  // The dataset is small enough that sorting in memory is the simpler option.
  luners.sort((a, b) => {
    switch (sort) {
      case "rarity":
        return rarityOrder(b.rarity) - rarityOrder(a.rarity) || a.name.localeCompare(b.name);
      case "rarity-asc":
        return rarityOrder(a.rarity) - rarityOrder(b.rarity) || a.name.localeCompare(b.name);
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
    }
  });

  res.json({ luners });
}

/** GET /api/luners/stats, per-rarity counts for the dashboard header. */
export async function stats(_req: Request, res: Response): Promise<void> {
  const grouped = await prisma.luner.groupBy({ by: ["rarity"], _count: { _all: true } });
  const counts = new Map(grouped.map((g) => [g.rarity, g._count._all]));

  res.json({
    total: grouped.reduce((sum, g) => sum + g._count._all, 0),
    byRarity: RARITIES.map((r) => ({
      rarity: r.name,
      count: counts.get(r.name) ?? 0,
      dropRate: r.dropRate,
      points: r.points,
    })),
  });
}

/** POST /api/luners, create. */
export async function create(req: Request, res: Response): Promise<void> {
  const data = validate(lunerCreateSchema, req.body, "Invalid luner");
  const luner = await prisma.luner.create({ data });
  res.status(201).json({ luner });
}

/** PATCH /api/luners/:id, update any subset of fields. */
export async function update(req: Request, res: Response): Promise<void> {
  const id = validate(idParamSchema, req.params.id, "Invalid luner id");
  const data = validate(lunerUpdateSchema, req.body, "Invalid luner");

  const luner = await prisma.luner.update({ where: { id }, data });
  res.json({ luner });
}

/** DELETE /api/luners/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = validate(idParamSchema, req.params.id, "Invalid luner id");

  await prisma.luner.delete({ where: { id } });
  res.status(204).end();
}

/** POST /api/luners/upload, push a base64 image to Imgur and return its link. */
export async function upload(req: Request, res: Response): Promise<void> {
  if (!imgurEnabled()) {
    throw new HttpError(
      501,
      "Imgur uploads are not configured. Set IMGUR_CLIENT_ID in server/.env, or paste an image URL instead.",
    );
  }

  const { data, filename } = validate(uploadSchema, req.body, "Invalid upload");
  const imageUrl = await uploadToImgur(normalizeBase64Image(data), filename);
  res.json({ imageUrl });
}
