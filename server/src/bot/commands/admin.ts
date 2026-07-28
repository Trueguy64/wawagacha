import { EmbedBuilder, MessageFlags, SlashCommandBuilder, time } from "discord.js";
import { grantAdmin, isAdmin, listAdmins, revokeAdmin } from "../permissions.js";
import type { Command } from "./types.js";

const mention = (id: string, isRole: boolean): string => (isRole ? `<@&${id}>` : `<@${id}>`);

export const admin: Command = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Manage who has bot admin rights (admins only)")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Grant a user or a whole role bot admin rights")
        .addUserOption((option) => option.setName("user").setDescription("Who to promote"))
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role to promote, anyone carrying it counts as an admin"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Take away a user's or a role's bot admin rights")
        .addUserOption((option) => option.setName("user").setDescription("Who to demote"))
        .addRoleOption((option) => option.setName("role").setDescription("Role to demote")),
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("Show everyone with admin rights")),

  async execute(interaction) {
    // Admins manage admins. The owner is still resolved from Discord and can't
    // be revoked, so the worst case is admins demoting each other, recoverable
    // by the owner.
    if (!(await isAdmin(interaction))) {
      await interaction.reply({
        content: "That command is for bot admins only.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "list") {
      const { owners, granted } = await listAdmins();

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle("🌙 Bot admins")
        .addFields({
          name: "Owner",
          value: owners.map((id) => `<@${id}>`).join("\n") || ",",
        });

      embed.addFields({
        name: `Granted (${granted.length})`,
        value:
          granted
            .map((row) => `${mention(row.id, row.isRole)}, added by <@${row.grantedBy}> ${time(row.grantedAt, "R")}`)
            .join("\n") || "Nobody yet. Use `/admin add` to promote someone.",
      });

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    // Exactly one of the two, Discord can't express "either/or" on options.
    const user = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");

    if (!user === !role) {
      await interaction.reply({
        content: "Pick exactly one: a `user` **or** a `role`.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const id = (user ?? role)!.id;
    const name = user ? user.username : role!.name;
    const who = mention(id, !user);

    if (subcommand === "add") {
      const result = await grantAdmin(id, name, interaction.user.id, !user);
      await interaction.reply({
        content: {
          granted: user
            ? `${who} is now a bot admin.`
            : `Everyone with ${who} is now a bot admin.`,
          "already-admin": `${who} already has bot admin rights.`,
          "is-owner": `${who} owns the bot, they already have every right.`,
        }[result],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const result = await revokeAdmin(id);
    await interaction.reply({
      content: {
        revoked: `${who} no longer has bot admin rights.`,
        "not-admin": `${who} doesn't have bot admin rights.`,
        "is-owner": "The bot owner's rights can't be removed.",
      }[result],
      flags: MessageFlags.Ephemeral,
    });
  },
};
