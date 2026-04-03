import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Tin Collections",
  description: "DeepCharity Tin Collections",
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <style>{`
        html, body {
          overflow: hidden !important;
          height: 100% !important;
          width: 100% !important;
          position: fixed !important;
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          touch-action: manipulation;
        }
        input, textarea {
          font-size: 16px !important; /* prevents iOS zoom on focus */
          touch-action: auto;
        }
      `}</style>
    </>
  );
}
