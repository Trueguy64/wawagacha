import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../http.js";
import { ImgurError } from "../imgur.js";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Unknown endpoint" });
}

/**
 * Single place where thrown errors become HTTP responses, so controllers can
 * just let Prisma/Imgur failures bubble up (Express 5 forwards async rejections).
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }
  if (typeof error === "object" && error !== null && (error as { type?: string }).type === "entity.too.large") {
    res.status(413).json({ error: "Image is too large (10 MB max)" });
    return;
  }
  if (error instanceof ImgurError) {
    res.status(502).json({ error: error.message });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "Luner not found" });
      return;
    }
    if (error.code === "P2002") {
      res.status(409).json({ error: "A luner with that name already exists" });
      return;
    }
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Something went wrong on the server" });
}
