import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { rarityOrder, rarityPoints } from "../../rarity.js";
import { rarityEmoji } from "../format.js";
import { rollManyForPlayer } from "../gacha.js";
import { isAdmin } from "../permissions.js";
import type { Command } from "./types.js";

// Capped so one command can't fire off hundreds of writes or overflow the embed.
const MAX_ROLLS = 25;

export const xroll: Command = {
  data: new SlashCommandBuilder()
    .setName("xroll")
    .setDescription("Roll several times at once, ignoring the cooldown (admins only)")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription(`How many rolls (1–${MAX_ROLLS})`)
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(MAX_ROLLS),
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

    const amount = interaction.options.getInteger("amount", true);
    const result = await rollManyForPlayer(
      interaction.user.id,
      interaction.user.displayName,
      amount,
    );

    if (result.status === "empty-pool") {
      await interaction.editReply(
        "There are no luners to roll yet, an admin needs to add some on the admin site first.",
      );
      return;
    }

    // Group duplicates so 25 rolls stay readable.
    const counts = new Map<number, { name: string; rarity: string; count: number }>();
    for (const { luner } of result.draws) {
      const row = counts.get(luner.id) ?? { name: luner.name, rarity: luner.rarity, count: 0 };
      row.count += 1;
      counts.set(luner.id, row);
    }

    const lines = [...counts.values()]
      .sort((a, b) => rarityOrder(b.rarity) - rarityOrder(a.rarity) || a.name.localeCompare(b.name))
      .map((row) => `${rarityEmoji(row.rarity)} **${row.name}**${row.count > 1 ? ` ×${row.count}` : ""}`);

    const points = result.draws.reduce((sum, d) => sum + rarityPoints(d.luner.rarity), 0);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x8b5cf6)
          .setAuthor({
            name: `${interaction.user.displayName} rolled ${amount}×…`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTitle("Admin bulk roll")
          .setDescription(lines.join("\n"))
          .setFooter({ text: `${points} points` }),
      ],
    });
  },
};
