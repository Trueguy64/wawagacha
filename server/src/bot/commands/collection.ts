import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { rarityEmoji } from "../format.js";
import { type Collection, getCollection } from "../queries.js";
import type { Command } from "./types.js";

const PAGE_SIZE = 15;
const PAGE_TIMEOUT_MS = 3 * 60 * 1000;

export const collection: Command = {
  data: new SlashCommandBuilder()
    .setName("collection")
    .setDescription("Show every luner you own"),

  async execute(interaction) {
    await interaction.deferReply();

    const owned = await getCollection(interaction.user.id);
    const displayName = interaction.user.displayName;
    const avatar = interaction.user.displayAvatarURL();

    if (owned.cards.length === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x64748b)
            .setAuthor({ name: `${displayName}'s collection`, iconURL: avatar })
            .setDescription("You don't own any luners yet. Try `/roll` to get your first one!"),
        ],
      });
      return;
    }

    const pageCount = Math.ceil(owned.cards.length / PAGE_SIZE);
    let page = 0;

    const render = () => renderPage(owned, page, pageCount, displayName, avatar);

    if (pageCount === 1) {
      await interaction.editReply({ embeds: [render()] });
      return;
    }

    await interaction.editReply({ embeds: [render()], components: [pageButtons(page, pageCount)] });

    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: PAGE_TIMEOUT_MS,
    });

    collector.on("collect", async (button) => {
      if (button.user.id !== interaction.user.id) {
        await button.reply({
          content: "That's someone else's collection, run `/collection` to see your own.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      page = Math.min(Math.max(page + (button.customId === "next" ? 1 : -1), 0), pageCount - 1);
      await button.update({ embeds: [render()], components: [pageButtons(page, pageCount)] });
    });

    collector.on("end", async () => {
      await interaction
        .editReply({ embeds: [render()], components: [pageButtons(page, pageCount, true)] })
        .catch(() => undefined); // message may have been deleted
    });
  },
};

function renderPage(
  owned: Collection,
  page: number,
  pageCount: number,
  displayName: string,
  avatar: string,
): EmbedBuilder {
  const cards = owned.cards.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Cards arrive sorted by rarity, so a header whenever the rarity changes is
  // enough to group them.
  const lines: string[] = [];
  let currentRarity: string | null = null;
  for (const card of cards) {
    if (card.rarity !== currentRarity) {
      currentRarity = card.rarity;
      lines.push(`${lines.length ? "\n" : ""}${rarityEmoji(card.rarity)} **${card.rarity}**`);
    }
    const copies = card.quantity > 1 ? ` ×${card.quantity}` : "";
    lines.push(`\`#${card.lunerId}\` ${card.name}${copies}, ${card.points} pts`);
  }

  const summary = owned.byRarity
    .map((row) => `${rarityEmoji(row.rarity)} ${row.total}`)
    .join("  ");

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setAuthor({ name: `${displayName}'s collection`, iconURL: avatar })
    .setDescription(lines.join("\n"))
    .addFields(
      { name: "Total points", value: `**${owned.totalPoints}**`, inline: true },
      { name: "Cards", value: `${owned.totalCards} (${owned.uniqueCards} unique)`, inline: true },
      { name: "By rarity", value: summary || ",", inline: false },
    );

  // Discord rejects an empty footer string, so leave it off entirely on a single page.
  if (pageCount > 1) embed.setFooter({ text: `Page ${page + 1} of ${pageCount}` });

  return embed;
}

function pageButtons(page: number, pageCount: number, expired = false) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("◀ Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(expired || page === 0),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(expired || page >= pageCount - 1),
  );
}
