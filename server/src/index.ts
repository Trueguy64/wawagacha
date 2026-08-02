import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./env.js";
import { imgurEnabled } from "./imgur.js";
import { errorHandler } from "./middlewares/error.js";
import { apiRouter } from "./routes/index.js";
import cors from "cors";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
    origin: "https://wawagacha-server.vercel.app",
    credentials: true,
}));

app.use(express.json({ limit: "15mb" }));
app.use(cookieParser(env.COOKIE_SECRET));

app.use("/api", apiRouter);
app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
});

/* ------------------------------------------------- API Check --- */
// A simple route for the root domain so you know the server is running
app.get("/", (_req, res) => {
  res.status(200).send("Wawagacha API is online and running!");
});

// If a request makes it this far and isn't an API route or the root, it's a 404
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Wawagacha admin API listening on http://localhost:${env.PORT}`);
  if (!imgurEnabled()) {
    console.log("Imgur uploads disabled (IMGUR_CLIENT_ID not set), image URLs can still be pasted.");
  }
});
