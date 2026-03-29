import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const contactEmail = formData.get("contactEmail") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;
    const description = formData.get("description") as string;
    const assignedToEmail = formData.get("assignedToEmail") as string;

    // Validate required fields
    if (!title || !contactEmail || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create contact by email
    let contact = await prisma.contact.findFirst({
      where: { email: contactEmail },
    });

    if (!contact) {
      // Parse name from email if possible, otherwise use email as first name
      const nameParts = contactEmail.split("@")[0].split(".");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts[1] || "Contact";

      contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: contactEmail,
          createdById: session.id,
        },
      });
    }

    // Find assigned user if email provided
    let assignedToId: string | null = null;
    if (assignedToEmail) {
      const assignedUser = await prisma.user.findUnique({
        where: { email: assignedToEmail },
      });
      if (assignedUser) {
        assignedToId = assignedUser.id;
      }
    }

    // Generate case number
    const caseNumber = `CASE-${Date.now()}`;

    // Create case record
    const caseRecord = await prisma.caseRecord.create({
      data: {
        caseNumber,
        contactId: contact.id,
        title,
        description: description || null,
        category,
        priority,
        status: "OPEN",
        assignedToId,
        createdById: session.id,
      },
    });

    // Create initial activity
    await prisma.caseActivity.create({
      data: {
        caseId: caseRecord.id,
        type: "NOTE",
        description: "Case opened",
        createdById: session.id,
      },
    });

    return NextResponse.json({ id: caseRecord.id, caseNumber }, { status: 201 });
  } catch (error) {
    console.error("Case creation error:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}
