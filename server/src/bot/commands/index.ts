import { admin } from "./admin.js";
import { clearcollection } from "./clearcollection.js";
import { clearleaderboard } from "./clearleaderboard.js";
import { collection } from "./collection.js";
import { forceend } from "./forceend.js";
import { leaderboard } from "./leaderboard.js";
import { resetcooldown } from "./resetcooldown.js";
import { roll } from "./roll.js";
import type { Command } from "./types.js";
import { view } from "./view.js";
import { xroll } from "./xroll.js";

export const commands: Command[] = [
  roll,
  xroll,
  collection,
  view,
  leaderboard,
  clearcollection,
  clearleaderboard,
  resetcooldown,
  admin,
  forceend,
];

export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
