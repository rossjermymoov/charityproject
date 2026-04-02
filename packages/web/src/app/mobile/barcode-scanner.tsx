"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerId = "barcode-reader";

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          scanner.stop().then(() => {
            onScan(decodedText);
          }).catch(() => {
            onScan(decodedText);
          });
        },
        () => {} // ignore scan failures
      )
      .catch((err: Error) => {
        setError("Could not access camera. Please check permissions.");
        console.error("Scanner error:", err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">Scan Tin Barcode</h2>
          <button
            onClick={() => {
              scannerRef.current?.stop().catch(() => {});
              onClose();
            }}
            className="text-white bg-white/20 rounded-full w-12 h-12 flex items-center justify-center text-2xl active:bg-white/30"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scanner viewport */}
      <div className="flex items-center justify-center h-full">
        <div id={containerId} className="w-full" />
      </div>

      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white p-6 text-center">
          <p className="text-lg font-semibold">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-white text-red-600 font-bold px-8 py-3 rounded-xl text-lg"
          >
            Close
          </button>
        </div>
      )}

      {!error && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-5 py-8 text-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 2rem)" }}>
          <p className="text-white text-lg">Point camera at the barcode on the tin</p>
          <button
            onClick={() => {
              scannerRef.current?.stop().catch(() => {});
              onClose();
            }}
            className="mt-4 text-white/70 text-base underline"
          >
            Type manually instead
          </button>
        </div>
      )}
    </div>
  );
}
