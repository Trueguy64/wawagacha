import type { NextFunction, Request, Response } from "express";
import { isAuthenticated } from "../auth.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  next();
}
