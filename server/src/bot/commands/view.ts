import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../../prisma/client.js";
import { rarityPoints } from "../../rarity.js";
import { rarityColor, rarityEmoji } from "../format.js";
import type { Command } from "./types.js";

export const view: Command = {
  data: new SlashCommandBuilder()
    .setName("view")
    .setDescription("Show one luner from your collection")
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("The luner's ID, as shown in /collection")
        .setRequired(true)
        .setMinValue(1),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const id = interaction.options.getInteger("id", true);
    const luner = await prisma.luner.findUnique({ where: { id } });
    const copies = luner
      ? await prisma.pull.count({ where: { playerId: interaction.user.id, lunerId: id } })
      : 0;

    // An unknown ID and an unowned one get the same answer: from the player's
    // side both mean "not yours", and it doesn't leak what else exists.
    if (!luner || copies === 0) {
      await interaction.editReply("You don't have it in your collection");
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(rarityColor(luner.rarity))
          .setAuthor({
            name: `${interaction.user.displayName}'s collection`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTitle(`${rarityEmoji(luner.rarity)} ${luner.name}`)
          .setImage(luner.imageUrl)
          .addFields(
            { name: "Rarity", value: luner.rarity, inline: true },
            { name: "Copies owned", value: `${copies}`, inline: true },
            { name: "Points", value: `${rarityPoints(luner.rarity) * copies}`, inline: true },
          )
          .setFooter({ text: `#${luner.id}` }),
      ],
    });
  },
};
