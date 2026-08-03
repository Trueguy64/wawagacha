import crypto from "node:crypto";
import type { Request, Response } from "express";
import { env } from "./env.js";

const COOKIE_NAME = "wawagacha_admin";
const SESSION_VALUE = "admin";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(password: string): boolean {
  return safeEqual(password, env.ADMIN_PASSWORD);
}

export function startSession(res: Response): void {
  res.cookie(COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    signed: true,
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function endSession(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function isAuthenticated(req: Request): boolean {
  return req.signedCookies?.[COOKIE_NAME] === SESSION_VALUE;
}
