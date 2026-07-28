/**
 * Inserts the example luner so the admin site has something to show on a fresh
 * database. Safe to re-run — existing names are skipped.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const luners = [
  {
    name: "Angry luner",
    rarity: "Epic",
    imageUrl:
      "https://media.discordapp.net/attachments/1253349164306268190/1517601760578109562/luna.png?ex=6a66ff07&is=6a65ad87&hm=37171eb5f3242892e8b40f4dc12632eb170cfa5423319f4fd5a91501d0c1a809&=&format=webp&quality=lossless&width=724&height=967",
  },
];

for (const luner of luners) {
  await prisma.luner.upsert({
    where: { name: luner.name },
    update: {},
    create: luner,
  });
  console.log(`seeded: ${luner.name}`);
}

await prisma.$disconnect();
