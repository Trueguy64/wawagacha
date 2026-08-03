import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { isAdmin } from "../permissions.js";
import type { Command } from "./types.js";
import { announceWeeklyWinner } from "../cron.js";

export const forceend: Command = {
  data: new SlashCommandBuilder()
    .setName("forceend")
    .setDescription("Force end the leaderboard early, pings the winner."),
  async execute(interaction) {
    if (!(await isAdmin(interaction))) {
      await interaction.reply({
        content: "That command is for bot admins only.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      // FIX: Removed interaction.channelId. 
      // Now it only passes the client and the forceEnd boolean.
      await announceWeeklyWinner(interaction.client, true);
      
      await interaction.editReply("Leaderboard force ended successfully");
    } catch (error) {
      console.error("Error force ending leaderboard:", error);
      await interaction.editReply("Something went wrong while force ending the leaderboard.");
    }
  },
};
