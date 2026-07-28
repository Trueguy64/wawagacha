import express, { Router } from "express";
import { create, list, remove, stats, update, upload } from "../controllers/luners.controller.js";

export const lunersRouter = Router();

lunersRouter.get("/", list);
lunersRouter.get("/stats", stats);
lunersRouter.post("/", create);
lunersRouter.patch("/:id", update);
lunersRouter.delete("/:id", remove);

// Own body parser: images are far larger than the global JSON default.
lunersRouter.post("/upload", express.json({ limit: "15mb" }), upload);
