/**
 * Migration script to create EmailMarketingSync and SyncLog tables
 * Run: npx tsx scripts/create-email-marketing-tables.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Creating EmailMarketingSync and SyncLog tables...");

  try {
    // Check if table already exists by trying to count records
    const existingCount = await prisma.emailMarketingSync.count().catch(() => -1);

    if (existingCount >= 0) {
      console.log("Tables already exist. Skipping creation.");
      return;
    }
  } catch (error) {
    console.log("Tables do not exist yet. Creating...");
  }

  // Use raw SQL to create tables if they don't exist
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailMarketingSync" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "provider" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
        "apiKey" TEXT,
        "apiEndpoint" TEXT,
        "lastSyncAt" TIMESTAMP(3),
        "syncFrequency" TEXT NOT NULL DEFAULT 'MANUAL',
        "settings" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "EmailMarketingSync_provider_idx" ON "EmailMarketingSync"("provider");
      CREATE INDEX IF NOT EXISTS "EmailMarketingSync_status_idx" ON "EmailMarketingSync"("status");
      CREATE INDEX IF NOT EXISTS "EmailMarketingSync_lastSyncAt_idx" ON "EmailMarketingSync"("lastSyncAt");

      CREATE TABLE IF NOT EXISTS "SyncLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "syncId" TEXT NOT NULL,
        "direction" TEXT NOT NULL,
        "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
        "recordsCreated" INTEGER NOT NULL DEFAULT 0,
        "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
        "recordsFailed" INTEGER NOT NULL DEFAULT 0,
        "errors" JSONB NOT NULL DEFAULT '[]',
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'RUNNING',

        CONSTRAINT "SyncLog_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "EmailMarketingSync"("id") ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "SyncLog_syncId_idx" ON "SyncLog"("syncId");
      CREATE INDEX IF NOT EXISTS "SyncLog_direction_idx" ON "SyncLog"("direction");
      CREATE INDEX IF NOT EXISTS "SyncLog_status_idx" ON "SyncLog"("status");
      CREATE INDEX IF NOT EXISTS "SyncLog_startedAt_idx" ON "SyncLog"("startedAt");
    `);

    console.log("✓ EmailMarketingSync table created successfully");
    console.log("✓ SyncLog table created successfully");
    console.log("✓ Indexes created successfully");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already exists")
    ) {
      console.log("Tables already exist. Skipping creation.");
    } else {
      console.error("Error creating tables:", error);
      throw error;
    }
  }

  console.log("\nMigration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
