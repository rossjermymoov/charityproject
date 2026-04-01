import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { MobileHome } from "./mobile-home";

export default async function MobilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/mobile/login");
  }

  // Get user's volunteer profile
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      linkedContact: true,
      volunteerProfile: true,
    },
  });

  // Get runs assigned to this user (or all if admin)
  const isAdmin = session.role === "ADMIN" || session.role === "MANAGER";

  const activeRuns = await prisma.collectionRun.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      ...(isAdmin ? {} : { assignedToId: user?.volunteerProfile?.id }),
    },
    include: {
      route: true,
      assignedTo: { include: { contact: true } },
      runStops: true,
    },
    orderBy: { scheduledDate: "asc" },
  });

  const completedRuns = await prisma.collectionRun.findMany({
    where: {
      status: "COMPLETED",
      ...(isAdmin ? {} : { assignedToId: user?.volunteerProfile?.id }),
    },
    include: {
      route: true,
      runStops: true,
    },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  return (
    <MobileHome
      user={JSON.parse(JSON.stringify({ name: session.name, role: session.role }))}
      activeRuns={JSON.parse(JSON.stringify(activeRuns))}
      completedRuns={JSON.parse(JSON.stringify(completedRuns))}
    />
  );
}
