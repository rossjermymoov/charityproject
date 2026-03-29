"use client";

import { useEffect, useState } from "react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    async function generate() {
      try {
        const res = await fetch(`/api/qr?url=${encodeURIComponent(url)}&size=${size}`);
        if (res.ok) {
          const data = await res.json();
          setDataUrl(data.dataUrl);
        }
      } catch {
        // ignore
      }
    }
    generate();
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center animate-pulse"
        style={{ width: size, height: size }}
      >
        <p className="text-xs text-gray-400">Generating...</p>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code for ${url}`}
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}
