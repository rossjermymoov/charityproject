import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MobileRouteClient } from "./mobile-route-client";

export default async function MobileRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const route = await prisma.collectionRoute.findUnique({
    where: { id },
    include: {
      stops: {
        include: {
          location: true,
          deployedTin: true,
          collectedTin: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      assignedTo: { include: { contact: true } },
    },
  });

  if (!route) notFound();

  // Get available IN_STOCK tins for deployment
  const availableTins = await prisma.collectionTin.findMany({
    where: { status: "IN_STOCK" },
    orderBy: { tinNumber: "asc" },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileRouteClient
        route={JSON.parse(JSON.stringify(route))}
        availableTins={JSON.parse(JSON.stringify(availableTins))}
      />
    </div>
  );
}
