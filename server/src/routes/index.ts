import { Router } from "express";
import { requireAdmin } from "../middlewares/auth.js";
import { notFound } from "../middlewares/error.js";
import { authRouter } from "./auth.routes.js";
import { lunersRouter } from "./luners.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/luners", requireAdmin, lunersRouter);
apiRouter.use(notFound);
