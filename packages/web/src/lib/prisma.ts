import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// One-time data fix: convert any APPLICANT volunteers to ACTIVE
// Safe to run repeatedly — becomes a no-op once all records are updated
prisma.volunteerProfile
  .updateMany({
    where: { status: "APPLICANT" },
    data: { status: "ACTIVE" },
  })
  .then((result) => {
    if (result.count > 0) {
      console.log(`[data-fix] Updated ${result.count} volunteer(s) from APPLICANT to ACTIVE`);
    }
  })
  .catch(() => {
    // Silently ignore — table may not exist yet during initial setup
  });

export default prisma;
