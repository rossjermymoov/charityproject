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

// GET /api/mobile/routes?token=<userId> — fetch saved route templates for the user
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

  const routes = await prisma.collectionRoute.findMany({
    where: {
      isActive: true,
      ...(isAdmin ? {} : { assignedToId: user.volunteerProfile?.id }),
    },
    include: {
      stops: {
        include: { location: true },
        orderBy: { sortOrder: "asc" },
      },
      runs: {
        where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
        select: { id: true, status: true, scheduledDate: true },
        orderBy: { scheduledDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ routes }, { headers: corsHeaders });
}

// POST /api/mobile/routes — schedule a run from a route template
export async function POST(request: NextRequest) {
  try {
    const { token, routeId, scheduledDate } = await request.json();

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

    const route = await prisma.collectionRoute.findUnique({
      where: { id: routeId },
      include: {
        stops: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404, headers: corsHeaders });
    }

    // Create the run
    const run = await prisma.collectionRun.create({
      data: {
        routeId: route.id,
        status: "SCHEDULED",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        assignedToId: user.volunteerProfile?.id || null,
        createdById: user.id,
        runStops: {
          create: route.stops.map((stop) => ({
            routeStopId: stop.id,
            status: "PENDING",
          })),
        },
      },
      include: {
        route: true,
        runStops: {
          include: {
            routeStop: { include: { location: true } },
          },
          orderBy: { routeStop: { sortOrder: "asc" } },
        },
      },
    });

    return NextResponse.json({ ok: true, run }, { headers: corsHeaders });
  } catch (error) {
    console.error("Mobile routes POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: corsHeaders });
  }
}
