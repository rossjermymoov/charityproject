import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

const ALLOWED_TYPES = new Set([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

// Strip <script> tags, event handlers, and external references from SVG
function sanitiseSvg(svg: string): string {
  let out = svg;
  // Remove <script>...</script> blocks
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Remove on* event handler attributes
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  // Remove javascript: hrefs
  out = out.replace(/(href|xlink:href)\s*=\s*"javascript:[^"]*"/gi, "");
  out = out.replace(/(href|xlink:href)\s*=\s*'javascript:[^']*'/gi, "");
  // Remove <foreignObject> which can embed arbitrary HTML
  out = out.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
  return out;
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only SVG, PNG, JPEG, and WebP files are allowed" },
      { status: 400 },
    );
  }

  // Max 2 MB
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Logo must be under 2 MB" },
      { status: 400 },
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    if (file.type === "image/svg+xml") {
      const sanitised = sanitiseSvg(buffer.toString("utf8"));
      buffer = Buffer.from(sanitised, "utf8");
    }

    // Store as a data URL so the logo survives Railway's ephemeral filesystem
    const base64 = buffer.toString("base64");
    const logoUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 },
    );
  }
}

