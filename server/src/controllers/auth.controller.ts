import type { Request, Response } from "express";
import { checkPassword, endSession, isAuthenticated, startSession } from "../auth.js";
import { HttpError, validate } from "../http.js";
import { imgurEnabled } from "../imgur.js";
import { RARITIES } from "../rarity.js";
import { loginSchema } from "../schemas/auth.schema.js";

/** GET /api/auth/me, session state plus the config the admin site boots from. */
export function me(req: Request, res: Response): void {
  res.json({
    authenticated: isAuthenticated(req),
    imgurEnabled: imgurEnabled(),
    rarities: RARITIES,
  });
}

/** POST /api/auth/login */
export function login(req: Request, res: Response): void {
  const { password } = validate(loginSchema, req.body, "Invalid request");

  if (!checkPassword(password)) throw new HttpError(401, "Incorrect password");

  startSession(res);
  res.json({ authenticated: true });
}

/** POST /api/auth/logout */
export function logout(_req: Request, res: Response): void {
  endSession(res);
  res.json({ authenticated: false });
}
