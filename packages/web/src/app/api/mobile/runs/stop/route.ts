import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/mobile/runs/stop — complete or skip a run stop
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, runStopId, action, deployedTinNumber, collectedTinNumber, skipReason, notes, latitude, longitude } = body;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const user = await prisma.user.findUnique({ where: { id: token } });
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
    }

    if (action === "complete") {
      const runStop = await prisma.runStop.findUnique({
        where: { id: runStopId },
        include: {
          run: { include: { route: true } },
          routeStop: { include: { location: true } },
        },
      });

      if (!runStop) {
        return NextResponse.json({ error: "RunStop not found" }, { status: 404, headers: corsHeaders });
      }

      const now = new Date();

      let deployedTinId: string | null = null;
      let collectedTinId: string | null = null;

      if (deployedTinNumber) {
        const tin = await prisma.collectionTin.findFirst({
          where: { tinNumber: deployedTinNumber },
        });
        if (tin) {
          deployedTinId = tin.id;
          await prisma.collectionTin.update({
            where: { id: tin.id },
            data: {
              status: "DEPLOYED",
              deployedAt: now,
              locationId: runStop.routeStop.locationId,
              locationName: runStop.routeStop.location.name,
              locationAddress: runStop.routeStop.location.address,
            },
          });
          await prisma.collectionTinMovement.create({
            data: {
              tinId: tin.id,
              type: "DEPLOYED",
              date: now,
              notes: `Deployed on route: ${runStop.run.route.name}`,
              routeId: runStop.run.routeId,
            },
          });
        }
      }

      if (collectedTinNumber) {
        const tin = await prisma.collectionTin.findFirst({
          where: { tinNumber: collectedTinNumber },
        });
        if (tin) {
          collectedTinId = tin.id;
          await prisma.collectionTin.update({
            where: { id: tin.id },
            data: { status: "RETURNED" },
          });
          await prisma.collectionTinMovement.create({
            data: {
              tinId: tin.id,
              type: "COLLECTED",
              date: now,
              notes: `Collected on route: ${runStop.run.route.name}`,
              routeId: runStop.run.routeId,
            },
          });
        }
      }

      await prisma.runStop.update({
        where: { id: runStopId },
        data: {
          status: "COMPLETED",
          deployedTinId,
          collectedTinId,
          completedAt: now,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        },
      });

      return NextResponse.json({
        ok: true,
        deployedTinFound: !!deployedTinId,
        collectedTinFound: !!collectedTinId,
      }, { headers: corsHeaders });
    }

    if (action === "skip") {
      await prisma.runStop.update({
        where: { id: runStopId },
        data: {
          status: "SKIPPED",
          skipReason: skipReason || "Not accessible",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ ok: true }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error("Mobile stop POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: corsHeaders });
  }
}
