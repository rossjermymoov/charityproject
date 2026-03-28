import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      console.log(`Database has ${count} users. Skipping seed.`);
      process.exit(0);
    }
    console.log("Empty database. Will seed.");
    process.exit(1); // exit 1 = needs seeding
  } catch {
    console.log("Cannot check users (table may not exist yet). Will seed.");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

check();
