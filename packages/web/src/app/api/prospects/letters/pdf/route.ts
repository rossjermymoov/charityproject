import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type LetterInput = {
  prospectName: string;
  prospectAddress: string;
  letterBody: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function escPdf(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/£/g, "\\243");
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
    select: { orgName: true, primaryColour: true },
  });

  const orgName = settings?.orgName || "Our Charity";
  const colour = settings?.primaryColour || "#4f46e5";
  const [cr, cg, cb] = hexToRgb(colour);
  const rf = cr / 255, gf = cg / 255, bf = cb / 255;

  // A4 in points
  const W = 595.28;
  const H = 841.89;
  const MARGIN = 60;
  const LINE_HEIGHT = 15;
  const PARA_GAP = 8;
  const MAX_CHARS = 85; // chars per line at 10.5pt Helvetica

  // Build PDF with one letter per page
  const pageStreams: string[] = [];

  for (const letter of letters as LetterInput[]) {
    let stream = "";
    let y = H - MARGIN;

    // Header line in brand colour
    stream += `${rf} ${gf} ${bf} rg ${MARGIN} ${y + 5} ${W - 2 * MARGIN} 2 re f\n`;
    y -= 25;

    // Org name
    stream += `BT /F1 14 Tf ${rf} ${gf} ${bf} rg ${MARGIN} ${y} Td (${escPdf(orgName)}) Tj ET\n`;
    y -= 20;

    // Date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    stream += `BT /F2 10 Tf 0.4 0.4 0.4 rg ${MARGIN} ${y} Td (${escPdf(dateStr)}) Tj ET\n`;
    y -= 30;

    // Prospect address
    if (letter.prospectAddress) {
      const addrLines = letter.prospectAddress.split(",").map((s: string) => s.trim());
      for (const line of addrLines) {
        stream += `BT /F2 10 Tf 0.2 0.2 0.2 rg ${MARGIN} ${y} Td (${escPdf(line)}) Tj ET\n`;
        y -= LINE_HEIGHT;
      }
    }
    y -= 10;

    // Letter body — split by paragraphs (double newline)
    const paragraphs = letter.letterBody.split("\n\n");
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Check if this is a salutation/signature (short line)
      if (trimmed.length < 50 && (trimmed.startsWith("Dear") || trimmed.startsWith("Yours") || trimmed === orgName || trimmed.startsWith("http") || trimmed.startsWith("www"))) {
        // Render as single line, possibly bold for Dear/Yours
        const isBold = trimmed.startsWith("Dear") || trimmed.startsWith("Yours");
        const font = isBold ? "/F1" : "/F2";
        stream += `BT ${font} 10.5 Tf 0.15 0.15 0.15 rg ${MARGIN} ${y} Td (${escPdf(trimmed)}) Tj ET\n`;
        y -= LINE_HEIGHT + PARA_GAP;
      } else {
        // Wrap paragraph text
        const lines = wrapLine(trimmed, MAX_CHARS);
        for (const line of lines) {
          if (y < MARGIN + 30) {
            // Don't overflow — would need a second page per letter in extreme cases
            break;
          }
          stream += `BT /F2 10.5 Tf 0.15 0.15 0.15 rg ${MARGIN} ${y} Td (${escPdf(line)}) Tj ET\n`;
          y -= LINE_HEIGHT;
        }
        y -= PARA_GAP;
      }
    }

    // Footer line
    stream += `${rf} ${gf} ${bf} rg ${MARGIN} ${MARGIN - 10} ${W - 2 * MARGIN} 1 re f\n`;

    pageStreams.push(stream);
  }

  // === Build multi-page PDF ===
  const objects: string[] = [];
  let objNum = 0;

  function addObj(content: string): number {
    objNum++;
    objects.push(`${objNum} 0 obj\n${content}\nendobj`);
    return objNum;
  }

  // 1: Catalog
  addObj(`<< /Type /Catalog /Pages 2 0 R >>`);

  // 2: Pages (will update kids list after creating page objects)
  const pagesObjNum = 2;
  addObj("PLACEHOLDER"); // Will replace

  // Fonts
  const fontBoldNum = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);
  const fontRegNum = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);

  // Create page + content stream pairs
  const pageObjNums: number[] = [];
  for (const stream of pageStreams) {
    const streamBytes = Buffer.from(stream, "latin1");
    const contentNum = addObj(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`);
    const pageNum = addObj(
      `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${contentNum} 0 R /Resources << /Font << /F1 ${fontBoldNum} 0 R /F2 ${fontRegNum} 0 R >> >> >>`
    );
    pageObjNums.push(pageNum);
  }

  // Update Pages object with kids
  const kidsStr = pageObjNums.map((n) => `${n} 0 R`).join(" ");
  objects[pagesObjNum - 1] = `${pagesObjNum} 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjNums.length} >>\nendobj`;

  // Build the raw PDF bytes
  const header = "%PDF-1.4\n";
  const body = objects.join("\n") + "\n";

  // Calculate object offsets for xref
  const offsets: number[] = [];
  let pos = header.length;
  for (const obj of objects) {
    offsets.push(pos);
    pos += obj.length + 1; // +1 for newline between objects
  }

  const xrefOffset = header.length + body.length;
  let xref = `xref\n0 ${objNum + 1}\n`;
  xref += `0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objNum + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const pdfBytes = Buffer.from(header + body + xref + trailer, "latin1");

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="prospect-letters-${letters.length}.pdf"`,
    },
  });
}
