import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./env.js";
import { imgurEnabled } from "./imgur.js";
import { errorHandler } from "./middlewares/error.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser(env.COOKIE_SECRET));

app.use("/api", apiRouter);
app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
});

/* ------------------------------------------------- static admin website --- */

const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/dist");

app.use(express.static(webDist));
app.use((_req, res) => {
  res.sendFile(path.join(webDist, "index.html"), (error) => {
    if (error) {
      res
        .status(503)
        .type("text/plain")
        .send("Admin site is not built yet. Run `npm run dev` for the dev server, or `npm run build`.");
    }
  });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Wawagacha admin API listening on http://localhost:${env.PORT}`);
  if (!imgurEnabled()) {
    console.log("Imgur uploads disabled (IMGUR_CLIENT_ID not set), image URLs can still be pasted.");
  }
});
