import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { isAdmin } from "../permissions.js";
import type { Command } from "./types.js";
import { announceWeeklyWinner } from "../cron.js";

export const forceend: Command = {
  data: new SlashCommandBuilder()
    .setName("forceend")
    .setDescription("Force end the leaderboard early and ping the winner."),

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
      await announceWeeklyWinner(interaction.client, interaction.channelId, true);
      await interaction.editReply("Leaderboard force ended successfully");
    } catch (error) {
      console.error("Error force ending leaderboard:", error);
      await interaction.editReply("Something went wrong while force ending the leaderboard.");
    }
  },
};
