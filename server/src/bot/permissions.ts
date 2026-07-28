import { type ChatInputCommandInteraction, type Client, Team } from "discord.js";
import { prisma } from "../prisma/client.js";

/**
 * Who counts as an admin.
 *
 * The application owner is resolved from Discord at startup rather than stored
 * in the database, so ownership can't be revoked by a granted admin and can't
 * be lost by editing the database. Everyone else is a row in `Admin`.
 */
let ownerIds = new Set<string>();

/** Reads the application owner (or every member of the owning team). */
export async function loadOwners(client: Client): Promise<string[]> {
  const application = await client.application!.fetch();
  const owner = application.owner;

  const ids =
    owner instanceof Team ? [...owner.members.keys()] : owner ? [owner.id] : [];

  ownerIds = new Set(ids);
  return ids;
}

export const isOwner = (userId: string): boolean => ownerIds.has(userId);

/** The member's role IDs, from either shape `interaction.member` can take. */
function memberRoleIds(interaction: ChatInputCommandInteraction): string[] {
  const member = interaction.member;
  if (!member) return []; // DM, no roles to inherit admin from
  return Array.isArray(member.roles) ? member.roles : [...member.roles.cache.keys()];
}

/**
 * Takes the interaction rather than a user ID because admin can now be granted
 * to a role, and roles are only knowable from the member on the interaction.
 */
export async function isAdmin(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (isOwner(interaction.user.id)) return true;

  const ids = [interaction.user.id, ...memberRoleIds(interaction)];
  return (await prisma.admin.count({ where: { id: { in: ids } } })) > 0;
}

export type GrantResult = "granted" | "already-admin" | "is-owner";

export async function grantAdmin(
  id: string,
  username: string,
  grantedBy: string,
  isRole = false,
): Promise<GrantResult> {
  if (isOwner(id)) return "is-owner";
  if (await prisma.admin.findUnique({ where: { id } })) return "already-admin";

  await prisma.admin.create({ data: { id, username, isRole, grantedBy } });
  return "granted";
}

export type RevokeResult = "revoked" | "not-admin" | "is-owner";

export async function revokeAdmin(id: string): Promise<RevokeResult> {
  if (isOwner(id)) return "is-owner";

  const { count } = await prisma.admin.deleteMany({ where: { id } });
  return count > 0 ? "revoked" : "not-admin";
}

export type AdminList = {
  owners: string[];
  granted: { id: string; username: string; isRole: boolean; grantedBy: string; grantedAt: Date }[];
};

export async function listAdmins(): Promise<AdminList> {
  return {
    owners: [...ownerIds],
    granted: await prisma.admin.findMany({ orderBy: { grantedAt: "asc" } }),
  };
}
