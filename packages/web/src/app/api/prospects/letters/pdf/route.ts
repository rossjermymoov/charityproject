import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type LetterInput = {
  prospectName: string;
  prospectAddress: string;
  letterBody: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function wrapLine(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { letters } = await request.json();
  if (!Array.isArray(letters) || letters.length === 0) {
    return NextResponse.json({ error: "letters array required" }, { status: 400 });
  }

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { orgName: true, primaryColour: true, letterheadImage: true },
  });

  const orgName = settings?.orgName || "Our Charity";
  const colour = settings?.primaryColour || "#4f46e5";
  const [rf, gf, bf] = hexToRgb(colour);
  const brandColour = rgb(rf, gf, bf);

  // A4 in points
  const W = 595.28;
  const H = 841.89;
  const MARGIN = 60;
  const LINE_HEIGHT = 15;
  const PARA_GAP = 8;
  const MAX_CHARS = 85;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Embed letterhead image if available
  let letterheadEmbed: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  let letterheadHeight = 0;

  if (settings?.letterheadImage) {
    try {
      const dataUrlMatch = settings.letterheadImage.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (dataUrlMatch) {
        const imgType = dataUrlMatch[1];
        const imgBase64 = dataUrlMatch[2];
        const imgBytes = Buffer.from(imgBase64, "base64");

        if (imgType === "png") {
          letterheadEmbed = await pdfDoc.embedPng(imgBytes);
        } else {
          letterheadEmbed = await pdfDoc.embedJpg(imgBytes);
        }

        // Scale letterhead to fit page width minus margins
        const maxWidth = W - 2 * MARGIN;
        const scale = maxWidth / letterheadEmbed.width;
        letterheadHeight = letterheadEmbed.height * scale;
      }
    } catch (e) {
      // If letterhead fails to embed, continue without it
      console.error("Failed to embed letterhead:", e);
    }
  }

  for (const letter of letters as LetterInput[]) {
    const page = pdfDoc.addPage([W, H]);
    let y = H - MARGIN;

    // Draw letterhead image if available
    if (letterheadEmbed) {
      const maxWidth = W - 2 * MARGIN;
      const scale = maxWidth / letterheadEmbed.width;
      const imgW = letterheadEmbed.width * scale;
      const imgH = letterheadEmbed.height * scale;

      page.drawImage(letterheadEmbed, {
        x: MARGIN,
        y: y - imgH,
        width: imgW,
        height: imgH,
      });
      y -= imgH + 20;
    } else {
      // Fallback: brand colour header line + org name
      page.drawRectangle({
        x: MARGIN,
        y: y + 5,
        width: W - 2 * MARGIN,
        height: 2,
        color: brandColour,
      });
      y -= 25;

      page.drawText(orgName, {
        x: MARGIN,
        y,
        size: 14,
        font: fontBold,
        color: brandColour,
      });
      y -= 20;
    }

    // Date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    page.drawText(dateStr, {
      x: MARGIN,
      y,
      size: 10,
      font: fontReg,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 30;

    // Prospect address
    if (letter.prospectAddress) {
      const addrLines = letter.prospectAddress.split(",").map((s: string) => s.trim());
      for (const line of addrLines) {
        page.drawText(line, {
          x: MARGIN,
          y,
          size: 10,
          font: fontReg,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= LINE_HEIGHT;
      }
    }
    y -= 10;

    // Letter body — split by paragraphs (double newline)
    const paragraphs = letter.letterBody.split("\n\n");
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Salutation/signature lines
      if (trimmed.length < 50 && (trimmed.startsWith("Dear") || trimmed.startsWith("Yours") || trimmed === orgName || trimmed.startsWith("http") || trimmed.startsWith("www"))) {
        const isBold = trimmed.startsWith("Dear") || trimmed.startsWith("Yours");
        page.drawText(trimmed, {
          x: MARGIN,
          y,
          size: 10.5,
          font: isBold ? fontBold : fontReg,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= LINE_HEIGHT + PARA_GAP;
      } else {
        const lines = wrapLine(trimmed, MAX_CHARS);
        for (const line of lines) {
          if (y < MARGIN + 30) break;
          page.drawText(line, {
            x: MARGIN,
            y,
            size: 10.5,
            font: fontReg,
            color: rgb(0.15, 0.15, 0.15),
          });
          y -= LINE_HEIGHT;
        }
        y -= PARA_GAP;
      }
    }

    // Footer line
    page.drawRectangle({
      x: MARGIN,
      y: MARGIN - 10,
      width: W - 2 * MARGIN,
      height: 1,
      color: brandColour,
    });
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="prospect-letters-${letters.length}.pdf"`,
    },
  });
}
