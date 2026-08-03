import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { prisma } from "../../prisma/client.js";
import { RARITIES } from "../../rarity.js";
import { buildPool } from "../gacha.js";
import { rarityEmoji, shortDate } from "../format.js";
import { isAdmin } from "../permissions.js";
import { dayStart, weekStart } from "../queries.js";
import type { Command } from "./types.js";

const TOP_N = 10;

const SCOPES = {
  today: { label: "Today's roll stats", since: dayStart },
  week: { label: "This week's roll stats", since: weekStart },
  all: { label: "All-time roll stats", since: () => undefined },
} as const;

export const rollstats: Command = {
  data: new SlashCommandBuilder()
    .setName("rollstats")
    .setDescription("Which luners and rarities are actually being rolled (admins only)")
    .addStringOption((option) =>
      option
        .setName("scope")
        .setDescription("Today, this week, or all time (default: today)")
        .addChoices(
          { name: "Today", value: "today" },
          { name: "This week", value: "week" },
          { name: "All time", value: "all" },
        ),
    ),

  async execute(interaction) {
    if (!(await isAdmin(interaction))) {
      await interaction.reply({
        content: "That command is for bot admins only.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const scope = (interaction.options.getString("scope") ?? "today") as keyof typeof SCOPES;
    const since = SCOPES[scope].since();

    const grouped = await prisma.pull.groupBy({
      by: ["lunerId"],
      where: since ? { createdAt: { gte: since } } : {},
      _count: { _all: true },
    });

    const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle(SCOPES[scope].label);

    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
    if (total === 0) {
      embed.setDescription("No rolls in that window yet.");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const luners = await prisma.luner.findMany({
      where: { id: { in: grouped.map((g) => g.lunerId) } },
      select: { id: true, name: true, rarity: true },
    });
    const lunerById = new Map(luners.map((l) => [l.id, l]));

    // flatMap drops luners deleted from the pool between the two queries.
    const rolled = grouped
      .flatMap((g) => {
        const luner = lunerById.get(g.lunerId);
        return luner ? [{ luner, count: g._count._all }] : [];
      })
      .sort((a, b) => b.count - a.count || a.luner.name.localeCompare(b.luner.name));

    const pct = (count: number) => `${((count / total) * 100).toFixed(1)}%`;

    // Expected rates come from the live pool so they match what the gacha is
    // really weighting, not the raw table (rarities with no cards never drop).
    const pool = await buildPool();
    const poolWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    const expected = new Map(
      pool.map((entry) => [entry.rarity as string, (entry.weight / poolWeight) * 100]),
    );

    const rarityLines = [...RARITIES]
      .reverse()
      .map((r) => {
        const count = rolled
          .filter((row) => row.luner.rarity === r.name)
          .reduce((sum, row) => sum + row.count, 0);
        const target = expected.get(r.name);
        const vs = target === undefined ? "" : ` \`exp ${target.toFixed(1)}%\``;
        return `${rarityEmoji(r.name)} **${r.name}** ${pct(count)} \`${count}\`${vs}`;
      })
      .join("\n");

    embed
      .setDescription(rarityLines)
      .addFields({
        name: `Most rolled (top ${Math.min(TOP_N, rolled.length)} of ${rolled.length})`,
        value: rolled
          .slice(0, TOP_N)
          .map(
            ({ luner, count }) =>
              `${rarityEmoji(luner.rarity)} ${luner.name}, **${pct(count)}** \`${count}\``,
          )
          .join("\n"),
      })
      .setFooter({ text: `${total} roll${total === 1 ? "" : "s"}` });

    if (since) embed.addFields({ name: "Since", value: shortDate(since), inline: true });

    await interaction.editReply({ embeds: [embed] });
  },
};
