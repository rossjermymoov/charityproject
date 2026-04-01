import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MobileRouteClient } from "./mobile-route-client";

export default async function MobileRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const run = await prisma.collectionRun.findUnique({
    where: { id },
    include: {
      route: true,
      runStops: {
        include: {
          routeStop: { include: { location: true } },
          deployedTin: true,
          collectedTin: true,
        },
        orderBy: { routeStop: { sortOrder: "asc" } },
      },
      assignedTo: { include: { contact: true } },
    },
  });

  if (!run) notFound();

  // Get available IN_STOCK tins for deployment
  const availableTins = await prisma.collectionTin.findMany({
    where: { status: "IN_STOCK" },
    orderBy: { tinNumber: "asc" },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileRouteClient
        run={JSON.parse(JSON.stringify(run))}
        availableTins={JSON.parse(JSON.stringify(availableTins))}
      />
    </div>
  );
}
