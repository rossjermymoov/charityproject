import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET: Retrieve all active ledger codes
 */

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const codes = await prisma.ledgerCode.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({
    codes: codes.map((code) => ({
      id: code.id,
      code: code.code,
      name: code.name,
      description: code.description,
    })),
  });
}
