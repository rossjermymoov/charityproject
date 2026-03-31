import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailViaProvider } from "@/lib/email-providers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadBranding } from "@/lib/branding";

interface SupplierInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  organisation: { name: string } | null;
  lines: { type: "income" | "cost"; label: string }[];
}

async function getEventSuppliers(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      startDate: true,
      location: true,
      incomeLines: {
        where: { contactId: { not: null } },
        include: { contact: { include: { organisation: true } } },
      },
      costLines: {
        where: { contactId: { not: null } },
        include: { contact: { include: { organisation: true } } },
      },
    },
  });

  if (!event) return null;

  const contactMap = new Map<string, SupplierInfo>();

  for (const line of event.incomeLines) {
    if (!line.contact) continue;
    const existing = contactMap.get(line.contact.id);
    const lineInfo = { type: "income" as const, label: line.label };
    if (existing) {
      existing.lines.push(lineInfo);
    } else {
      contactMap.set(line.contact.id, { ...line.contact, lines: [lineInfo] });
    }
  }

  for (const line of event.costLines) {
    if (!line.contact) continue;
    const existing = contactMap.get(line.contact.id);
    const lineInfo = { type: "cost" as const, label: line.label };
    if (existing) {
      existing.lines.push(lineInfo);
    } else {
      contactMap.set(line.contact.id, { ...line.contact, lines: [lineInfo] });
    }
  }

  return {
    event,
    suppliers: Array.from(contactMap.values()).sort((a, b) =>
      a.lastName.localeCompare(b.lastName)
    ),
  };
}

async function generatePDF(
  eventName: string,
  eventDate: Date | null,
  eventLocation: string | null,
  suppliers: SupplierInfo[],
  orgName: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 595.28; // A4
  const PAGE_H = 841.89;
  const MARGIN = 50;
  const LINE_HEIGHT = 16;
  const SECTION_GAP = 24;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function checkNewPage(needed: number) {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  function drawText(text: string, x: number, fontSize: number, useBold = false, colour = rgb(0.067, 0.094, 0.153)) {
    const f = useBold ? fontBold : font;
    page.drawText(text, { x, y, size: fontSize, font: f, color: colour });
  }

  // ── Header ──────────────────────────────────────────────────
  drawText(orgName, MARGIN, 10, false, rgb(0.4, 0.4, 0.4));
  y -= 24;
  drawText("Supplier Contact Sheet", MARGIN, 20, true);
  y -= 22;
  drawText(eventName, MARGIN, 14, true, rgb(0.2, 0.2, 0.6));
  y -= 18;
  const meta: string[] = [];
  if (eventDate) meta.push(`Date: ${eventDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`);
  if (eventLocation) meta.push(`Location: ${eventLocation}`);
  meta.push(`Suppliers: ${suppliers.length}`);
  drawText(meta.join("  |  "), MARGIN, 9, false, rgb(0.4, 0.4, 0.4));
  y -= 12;

  // Divider
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= SECTION_GAP;

  // ── Suppliers ───────────────────────────────────────────────
  for (const supplier of suppliers) {
    const linesNeeded = 5 * LINE_HEIGHT + SECTION_GAP;
    checkNewPage(linesNeeded);

    // Name
    const name = `${supplier.firstName} ${supplier.lastName}`;
    drawText(name, MARGIN, 12, true);
    y -= LINE_HEIGHT;

    // Organisation
    if (supplier.organisation) {
      drawText(supplier.organisation.name, MARGIN + 10, 10, false, rgb(0.3, 0.3, 0.3));
      y -= LINE_HEIGHT;
    }

    // Contact details
    const details: string[] = [];
    if (supplier.phone) details.push(`Tel: ${supplier.phone}`);
    if (supplier.email) details.push(`Email: ${supplier.email}`);
    if (details.length > 0) {
      drawText(details.join("    "), MARGIN + 10, 9, false, rgb(0.25, 0.25, 0.25));
      y -= LINE_HEIGHT;
    }

    // Address
    const addrParts = [supplier.addressLine1, supplier.addressLine2, supplier.city, supplier.postcode].filter(Boolean);
    if (addrParts.length > 0) {
      drawText(addrParts.join(", "), MARGIN + 10, 9, false, rgb(0.25, 0.25, 0.25));
      y -= LINE_HEIGHT;
    }

    // Lines they're assigned to
    const lineLabels = supplier.lines.map((l) => `${l.label} (${l.type})`).join(", ");
    drawText(`Assigned: ${lineLabels}`, MARGIN + 10, 8, false, rgb(0.5, 0.5, 0.5));
    y -= LINE_HEIGHT;

    // Separator
    y -= 4;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
    y -= SECTION_GAP * 0.5;
  }

  // ── Footer ──────────────────────────────────────────────────
  y -= 12;
  checkNewPage(30);
  drawText(
    `Generated ${new Date().toLocaleDateString("en-GB")} at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
    MARGIN,
    8,
    false,
    rgb(0.6, 0.6, 0.6)
  );

  return pdfDoc.save();
}

// ── GET: Download PDF ─────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getEventSuppliers(id);
  if (!data) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (data.suppliers.length === 0) {
    return NextResponse.json({ error: "No suppliers assigned to this event" }, { status: 400 });
  }

  const branding = await loadBranding();
  const pdfBytes = await generatePDF(
    data.event.name,
    data.event.startDate,
    data.event.location,
    data.suppliers,
    branding.orgName
  );

  const filename = `${data.event.name.replace(/[^a-zA-Z0-9]/g, "-")}-Suppliers.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// ── POST: Email PDF ───────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const emailTo = body.emailTo as string;

  if (!emailTo) {
    return NextResponse.json({ error: "emailTo is required" }, { status: 400 });
  }

  const data = await getEventSuppliers(id);
  if (!data) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (data.suppliers.length === 0) {
    return NextResponse.json({ error: "No suppliers assigned" }, { status: 400 });
  }

  const branding = await loadBranding();
  const pdfBytes = await generatePDF(
    data.event.name,
    data.event.startDate,
    data.event.location,
    data.suppliers,
    branding.orgName
  );

  const filename = `${data.event.name.replace(/[^a-zA-Z0-9]/g, "-")}-Suppliers.pdf`;
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  const success = await sendEmailViaProvider({
    to: emailTo,
    subject: `Supplier Contact Sheet — ${data.event.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin-bottom: 8px;">Supplier Contact Sheet</h2>
        <p style="color: #374151; margin-bottom: 16px;">
          Attached is the supplier contact sheet for <strong>${data.event.name}</strong>
          with ${data.suppliers.length} supplier${data.suppliers.length !== 1 ? "s" : ""}.
        </p>
        <p style="color: #6B7280; font-size: 13px;">
          ${branding.orgName}
        </p>
      </div>
    `,
    attachments: [
      {
        content: pdfBase64,
        filename,
        type: "application/pdf",
      },
    ],
  });

  if (!success) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
