import { prisma } from "@/lib/prisma";
import { SuggestRouteClient } from "./suggest-client";

export default async function SuggestRoutePage() {
  const volunteers = await prisma.volunteerProfile.findMany({
    where: { status: "ACTIVE" },
    include: { contact: true },
    orderBy: { contact: { lastName: "asc" } },
  });

  // Get location stats for the intelligence panel
  const locationCount = await prisma.tinLocation.count({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
  });

  const deployedTins = await prisma.collectionTin.count({
    where: { status: "DEPLOYED" },
  });

  return (
    <SuggestRouteClient
      volunteers={JSON.parse(JSON.stringify(volunteers))}
      locationCount={locationCount}
      deployedTins={deployedTins}
    />
  );
}
