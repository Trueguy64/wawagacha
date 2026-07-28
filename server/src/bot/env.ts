import "dotenv/config";
import { z } from "zod";

/**
 * The bot's own slice of .env, kept separate from the web API's env so that
 * running the bot doesn't demand ADMIN_PASSWORD, and vice versa.
 */
const botEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN must be set"),
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID must be set"),
  /** Set during development to register commands instantly in one server. */
  DISCORD_GUILD_ID: z.string().optional(),
  /** The channel ID where weekly winner announcements will be posted. */
  DISCORD_ANNOUNCE_CHANNEL_ID: z.string().optional(),
});

const parsed = botEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
  console.error(
    `Invalid bot configuration:\n${issues.join("\n")}\n\nSee server/.env.example for where to get these.`,
  );
  process.exit(1);
}

export const botEnv = parsed.data;
