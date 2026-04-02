import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/mobile/runs?token=<userId>
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const user = await prisma.user.findUnique({
    where: { id: token },
    include: { volunteerProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
  }

  const isAdmin = user.role === "ADMIN" || user.role === "MANAGER";

  const runs = await prisma.collectionRun.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      ...(isAdmin ? {} : { assignedToId: user.volunteerProfile?.id }),
    },
    include: {
      route: true,
      assignedTo: { include: { contact: true } },
      runStops: {
        include: {
          routeStop: { include: { location: true } },
          deployedTin: true,
          collectedTin: true,
        },
        orderBy: { routeStop: { sortOrder: "asc" } },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json({ runs }, { headers: corsHeaders });
}

// POST /api/mobile/runs — start or complete a run
export async function POST(request: NextRequest) {
  try {
    const { token, runId, action } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const user = await prisma.user.findUnique({ where: { id: token } });
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
    }

    if (action === "start") {
      await prisma.collectionRun.update({
        where: { id: runId },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
    } else if (action === "complete") {
      await prisma.collectionRun.update({
        where: { id: runId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Mobile runs POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: corsHeaders });
  }
}
