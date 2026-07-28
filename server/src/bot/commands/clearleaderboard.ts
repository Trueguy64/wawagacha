import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { prisma } from "../../prisma/client.js";
import { shortDate } from "../format.js";
import { isAdmin } from "../permissions.js";
import { weekStart } from "../queries.js";
import type { Command } from "./types.js";

export const clearleaderboard: Command = {
  data: new SlashCommandBuilder()
    .setName("clearleaderboard")
    .setDescription("Wipe pulls to reset the leaderboard and everyone's collection (admins only)")
    .addStringOption((option) =>
      option
        .setName("scope")
        .setDescription("Just this week's pulls, or everything ever rolled")
        .setRequired(true)
        .addChoices(
          { name: "This week", value: "week" },
          { name: "All time", value: "all" },
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName("confirm")
        .setDescription("Yes, this deletes cards permanently and cannot be undone")
        .setRequired(true),
    ),

  async execute(interaction) {
    if (!(await isAdmin(interaction))) {
      await interaction.reply({
        content: "That command is for bot admins only.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Second gate on purpose: this is the one command in the bot that destroys
    // player data, and a mis-click shouldn't be enough to do it.
    if (!interaction.options.getBoolean("confirm", true)) {
      await interaction.reply({
        content: "Nothing cleared, set `confirm` to True if you really mean it.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const scope = interaction.options.getString("scope", true);
    const since = scope === "week" ? weekStart() : undefined;

    // Collections and points are both derived from Pull, so deleting the rows
    // clears inventories and the leaderboard in one go.
    const { count } = await prisma.pull.deleteMany({
      where: since ? { createdAt: { gte: since } } : {},
    });

    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle(scope === "week" ? "This week's leaderboard cleared" : "Leaderboard fully reset")
      .setDescription(
        `**${count}** card${count === 1 ? "" : "s"} removed from ${
          scope === "week" ? "everyone's collection for this week" : "every collection"
        }.`,
      )
      .setFooter({ text: `Cleared by ${interaction.user.displayName}` });

    if (since) embed.addFields({ name: "Week starting", value: shortDate(since), inline: true });

    await interaction.editReply({ embeds: [embed] });
  },
};
