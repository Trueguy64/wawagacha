import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { rarityPoints } from "../../rarity.js";
import { rarityColor, rarityEmoji, relativeTime } from "../format.js";
import { rollForPlayer } from "../gacha.js";
import type { Command } from "./types.js";

export const roll: Command = {
  data: new SlashCommandBuilder().setName("roll").setDescription("Roll for a luner (once every 18 hours)"),

  async execute(interaction) {
    await interaction.deferReply();

    const result = await rollForPlayer(interaction.user.id, interaction.user.displayName);

    if (result.status === "empty-pool") {
      await interaction.editReply(
        "There are no luners to roll yet, an admin needs to add some on the admin site first.",
      );
      return;
    }

    if (result.status === "cooldown") {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x64748b)
            .setTitle("Still resting")
            .setDescription(
              `You've already rolled recently. Your next roll unlocks ${relativeTime(result.nextRollAt)}.`,
            ),
        ],
      });
      return;
    }

    const { luner, copiesOwned, nextRollAt } = result;
    const isNew = copiesOwned === 1;

    const embed = new EmbedBuilder()
      .setColor(rarityColor(luner.rarity))
      .setAuthor({
        name: `${interaction.user.displayName} rolled…`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle(`${rarityEmoji(luner.rarity)} ${luner.name}`)
      .setImage(luner.imageUrl)
      .addFields(
        { name: "Rarity", value: luner.rarity, inline: true },
        { name: "Points", value: `${rarityPoints(luner.rarity)}`, inline: true },
        {
          name: "Copies owned",
          value: isNew ? "1" : `${copiesOwned}`,
          inline: true,
        },
      )
      .setFooter({ text: `#${luner.id}` });

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
