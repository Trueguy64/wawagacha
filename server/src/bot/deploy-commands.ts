/**
 * Registers the slash commands with Discord. Run npm run bot:deploy -w server once after changing any command's name, description or options
 *
 * With DISCORD_GUILD_ID set the commands appear in that server instantly.
 */
import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";
import { botEnv } from "./env.js";

const body = commands.map((command) => command.data.toJSON());
const rest = new REST().setToken(botEnv.DISCORD_TOKEN);

const route = botEnv.DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(botEnv.DISCORD_CLIENT_ID, botEnv.DISCORD_GUILD_ID)
  : Routes.applicationCommands(botEnv.DISCORD_CLIENT_ID);

await rest.put(route, { body });

console.log(
  `Registered ${body.length} command${body.length === 1 ? "" : "s"} (${body
    .map((c) => `/${c.name}`)
    .join(", ")}) ${botEnv.DISCORD_GUILD_ID ? `to guild ${botEnv.DISCORD_GUILD_ID}` : "globally"}.`,
);
