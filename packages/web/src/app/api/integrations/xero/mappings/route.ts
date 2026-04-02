import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET: List all XeroAccountMappings
 * POST: Create or update a mapping
 */

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const mappings = await prisma.xeroAccountMapping.findMany({
    include: {
      ledgerCode: {
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    mappings: mappings.map((m) => ({
      id: m.id,
      ledgerCodeId: m.ledgerCodeId,
      ledgerCode: m.ledgerCode?.code,
      ledgerCodeName: m.ledgerCode?.name,
      xeroAccountCode: m.xeroAccountCode,
      xeroAccountName: m.xeroAccountName,
      createdAt: m.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { ledgerCodeId, xeroAccountCode, xeroAccountName } = body;

  if (!ledgerCodeId || !xeroAccountCode) {
    return NextResponse.json(
      { error: "ledgerCodeId and xeroAccountCode are required" },
      { status: 400 }
    );
  }

  // Check if ledger code exists
  const ledgerCode = await prisma.ledgerCode.findUnique({
    where: { id: ledgerCodeId },
  });

  if (!ledgerCode) {
    return NextResponse.json(
      { error: "Ledger code not found" },
      { status: 404 }
    );
  }

  // Upsert mapping
  const mapping = await prisma.xeroAccountMapping.upsert({
    where: { ledgerCodeId },
    update: {
      xeroAccountCode,
      xeroAccountName: xeroAccountName || null,
    },
    create: {
      ledgerCodeId,
      xeroAccountCode,
      xeroAccountName: xeroAccountName || null,
    },
  });

  return NextResponse.json({
    saved: true,
    mapping: {
      id: mapping.id,
      ledgerCodeId: mapping.ledgerCodeId,
      xeroAccountCode: mapping.xeroAccountCode,
      xeroAccountName: mapping.xeroAccountName,
    },
  });
}
