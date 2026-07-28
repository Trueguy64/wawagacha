import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { prisma } from "../prisma/client.js";
import { commandsByName } from "./commands/index.js";
import { botEnv } from "./env.js";
import { loadOwners } from "./permissions.js";

// Slash commands arrive over the interaction gateway, so no privileged intents
// (message content, members) are needed.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (ready) => {
  console.log(`Wawagacha bot online as ${ready.user.tag}`);
  console.log(`Commands loaded: ${[...commandsByName.keys()].map((n) => `/${n}`).join(", ")}`);

  try {
    const owners = await loadOwners(ready);
    console.log(`Bot owner(s): ${owners.map((id) => `<@${id}>`).join(", ") || "none found"}`);
  } catch (error) {
    // Without this the owner can't use /admin, so make it loud rather than
    // letting the first "only the owner can do that" reply be the clue.
    console.error("Could not resolve the application owner from Discord:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandsByName.get(interaction.commandName);
  if (!command) {
    console.warn(`Received unknown command /${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`/${interaction.commandName} failed:`, error);

    const message = { content: "Something went wrong running that command.", flags: MessageFlags.Ephemeral } as const;
    await (interaction.deferred || interaction.replied
      ? interaction.followUp(message)
      : interaction.reply(message)
    ).catch(() => undefined);
  }
});

await client.login(botEnv.DISCORD_TOKEN);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    console.log(`\n${signal} received, shutting down.`);
    await client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  });
}
