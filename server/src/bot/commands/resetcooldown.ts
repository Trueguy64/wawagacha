import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { prisma } from "../../prisma/client.js";
import { isAdmin } from "../permissions.js";
import type { Command } from "./types.js";

export const resetcooldown: Command = {
  data: new SlashCommandBuilder()
    .setName("resetcooldown")
    .setDescription("Clear your own 18-hour roll cooldown (admins only)"),

  async execute(interaction) {
    if (!(await isAdmin(interaction))) {
      await interaction.reply({
        content: "That command is for bot admins only.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { count } = await prisma.player.updateMany({
      where: { id: interaction.user.id, lastRollAt: { not: null } },
      data: { lastRollAt: null },
    });

    await interaction.reply({
      content:
        count > 0
          ? "Cooldown cleared, `/roll` is ready for you."
          : "You had no cooldown running. `/roll` away.",
      flags: MessageFlags.Ephemeral,
    });
  },
};
