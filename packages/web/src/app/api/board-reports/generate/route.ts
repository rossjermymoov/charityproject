import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  generateQuarterlySummary,
  generateFundraisingUpdate,
  generateMembershipReport,
  generateComplianceReport,
} from "@/lib/board-reports";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, period, startDate, endDate } = body;

  if (!type || !period || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required fields: type, period, startDate, endDate" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const validTypes = [
    "QUARTERLY_SUMMARY",
    "ANNUAL_REVIEW",
    "FUNDRAISING_UPDATE",
    "MEMBERSHIP_REPORT",
    "COMPLIANCE_REPORT",
  ];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  let data;
  let title: string;

  switch (type) {
    case "QUARTERLY_SUMMARY":
    case "ANNUAL_REVIEW":
      data = await generateQuarterlySummary(start, end);
      title =
        type === "QUARTERLY_SUMMARY"
          ? `Quarterly Summary - ${period}`
          : `Annual Review - ${period}`;
      break;
    case "FUNDRAISING_UPDATE":
      data = await generateFundraisingUpdate(start, end);
      title = `Fundraising Update - ${period}`;
      break;
    case "MEMBERSHIP_REPORT":
      data = await generateMembershipReport(start, end);
      title = `Membership Report - ${period}`;
      break;
    case "COMPLIANCE_REPORT":
      data = await generateComplianceReport(start, end);
      title = `Compliance Report - ${period}`;
      break;
    default:
      return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  const report = await prisma.boardReport.create({
    data: {
      title,
      type,
      period,
      startDate: start,
      endDate: end,
      data: JSON.parse(JSON.stringify(data)),
      generatedById: session.id,
    },
    include: {
      generatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(report, { status: 201 });
}
