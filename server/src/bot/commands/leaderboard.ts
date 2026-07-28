import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { MEDALS, shortDate } from "../format.js";
import { getLeaderboard, weekStart } from "../queries.js";
import type { Command } from "./types.js";

const TOP_N = 10;

export const leaderboard: Command = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Global points leaderboard")
    .addStringOption((option) =>
      option
        .setName("scope")
        .setDescription("All-time totals, or just this week's race (default: this week)")
        .addChoices(
          { name: "This week", value: "week" },
          { name: "All time", value: "all" },
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const scope = interaction.options.getString("scope") ?? "week";
    const since = scope === "week" ? weekStart() : undefined;
    const rows = await getLeaderboard(since);

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(scope === "week" ? "This week's leaderboard" : "All-time leaderboard");

    if (rows.length === 0) {
      embed.setDescription(
        scope === "week"
          ? "Nobody has rolled this week yet. `/roll` to open the scoring!"
          : "Nobody has rolled yet. `/roll` to open the scoring!",
      );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const top = rows.slice(0, TOP_N);
    embed.setDescription(
      top
        .map((row, index) => {
          const place = MEDALS[index] ?? `**${index + 1}.**`;
          const you = row.playerId === interaction.user.id ? " ← you" : "";
          return `${place} ${row.username}, **${row.points}** pts \`${row.cards} cards\`${you}`;
        })
        .join("\n"),
    );

    // Anyone outside the top ten still gets to see where they stand.
    const ownIndex = rows.findIndex((row) => row.playerId === interaction.user.id);
    if (ownIndex >= TOP_N) {
      const own = rows[ownIndex];
      embed.addFields({
        name: "Your position",
        value: `**${ownIndex + 1}.** ${own.username}, **${own.points}** pts \`${own.cards} cards\``,
      });
    }

    embed.setFooter({
      text:
        scope === "week"
          ? "Resets Monday"
          : `${rows.length} player${rows.length === 1 ? "" : "s"} scoring`,
    });

    if (since) {
      embed.addFields({ name: "Week starting", value: shortDate(since), inline: true });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
