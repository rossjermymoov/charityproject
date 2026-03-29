import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const size = parseInt(request.nextUrl.searchParams.get("size") || "200");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return NextResponse.json({ dataUrl });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
