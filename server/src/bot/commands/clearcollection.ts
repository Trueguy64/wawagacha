import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { prisma } from "../../prisma/client.js";
import { isAdmin } from "../permissions.js";
import type { Command } from "./types.js";

export const clearcollection: Command = {
  data: new SlashCommandBuilder()
    .setName("clearcollection")
    .setDescription("Delete every card in your collection, or someone else's (admins only)")
    .addUserOption((option) =>
      option.setName("user").setDescription("Whose collection to clear (default: your own)"),
    ),

  async execute(interaction) {
    if (!(await isAdmin(interaction))) {
      await interaction.reply({
        content: "That command is for bot admins only.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const target = interaction.options.getUser("user") ?? interaction.user;
    const isSelf = target.id === interaction.user.id;

    // Pulls are the only record of ownership, so deleting them is the wipe.
    const { count } = await prisma.pull.deleteMany({ where: { playerId: target.id } });

    await interaction.reply({
      content: count
        ? `🧹 Cleared **${count}** card${count === 1 ? "" : "s"} from ${isSelf ? "your" : `${target}'s`} collection.`
        : `${isSelf ? "You have" : `${target} has`} no cards to clear.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
