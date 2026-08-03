import cron from "node-cron";
import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { getLeaderboard, weekStart } from "./queries.js";
import { botEnv } from "./env.js";
import { prisma } from "../prisma/client.js";

export async function announceWeeklyWinner(client: Client, channelId?: string, forceEnd: boolean = false) {
  const now = new Date();
  
  let since: Date | undefined;
  let until: Date | undefined;

  if (forceEnd) {
    // If forced, we announce the winner of the current week up to now
    since = weekStart(now);
    until = now;
  } else {
    // Normally runs on Monday 00:00, so we get the winner of the previous week
    since = weekStart(new Date(now.getTime() - 24 * 60 * 60 * 1000)); // shift back 1 day to get last week's Monday
    until = weekStart(now);
  }

  const rows = await getLeaderboard(since, until);
  const targetChannelId = channelId || botEnv.DISCORD_ANNOUNCE_CHANNEL_ID;

  if (targetChannelId) {
    const channel = client.channels.cache.get(targetChannelId) || await client.channels.fetch(targetChannelId).catch(() => null);
    if (channel && channel.isTextBased() && "send" in channel) {
      if (rows.length === 0) {
        await channel.send("nobody won <:sniffle:1338226636637863946>");
      } else {
        const winner = rows[0];
        await channel.send({ content: `<@${winner.playerId}> won with **${winner.points} points** <:steamhappy:1307411223297654854>`});
      }
    } else {
      console.warn(`Could not find a valid text channel for ID: ${targetChannelId}`);
    }
  }
}

export function startCronJobs(client: Client) {
  // Run every Monday at 00:00 UTC
  cron.schedule("0 0 * * 1", () => {
    console.log("Running weekly winner announcement cron job...");
    announceWeeklyWinner(client).catch((err) => {
      console.error("Error announcing weekly winner:", err);
    });
  }, {
    timezone: "UTC"
  });
}
